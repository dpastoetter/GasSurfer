import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChainGas, GasTier } from './types';
import { BITCOIN_CHAIN_ID } from './types';
import { EVM_CHAINS, MEMPOOL_API } from './config/chains';
import { rpcHostname } from './lib/rpcHostname';
import { loadSurfBandOverrides, type SurfBandOverride } from './lib/surfBandsStorage';
import { getSurfCondition } from './lib/surfCondition';

const EVM_BATCH_SIZE = 4;
const EVM_BATCH_DELAY_MS = 100;

/** Chains where we try `eth_getBlockByNumber` + `eth_maxPriorityFeePerGas` before legacy gas price. */
const EIP1559_CHAIN_IDS = new Set([
  1, 137, 8453, 42161, 10, 59144, 324, 5000, 100, 56, 250, 43114, 42220,
]);

export type GasPriceErrorKey = 'errorLoadGas' | 'errorRefreshGas' | null;

function weiToGwei(result: string | number): number {
  if (typeof result === 'number') {
    if (result >= 1e9) return result / 1e9;
    return result;
  }
  const wei = result.startsWith('0x') ? parseInt(result, 16) : parseInt(result, 10);
  return wei / 1e9;
}

function roundTier(n: number): number {
  return n >= 1 ? Math.round(n) : Math.round(n * 100) / 100;
}

async function jsonRpc(
  rpcUrl: string,
  method: string,
  params: unknown[]
): Promise<{ result?: unknown; error?: unknown; latencyMs: number }> {
  const t0 = performance.now();
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    });
    const latencyMs = Math.round(performance.now() - t0);
    const data = (await res.json()) as { result?: unknown; error?: unknown };
    return { ...data, latencyMs };
  } catch {
    return { error: 'network', latencyMs: Math.round(performance.now() - t0) };
  }
}

/** Base fee + suggested priority tip; effective used as “standard” tier. */
async function fetchEip1559Fees(
  rpcUrl: string
): Promise<{ baseFeeGwei: number; priorityFeeGwei: number; effectiveGwei: number; rpcLatencyMs: number } | null> {
  const blockRes = await jsonRpc(rpcUrl, 'eth_getBlockByNumber', ['latest', false]);
  if (blockRes.error) return null;
  const block = blockRes.result as { baseFeePerGas?: string } | null;
  const baseHex = block?.baseFeePerGas;
  if (!baseHex) return null;
  const base = weiToGwei(baseHex);
  if (!Number.isFinite(base) || base < 0) return null;

  let priority = 1.5;
  let extraLatency = 0;
  const tipRes = await jsonRpc(rpcUrl, 'eth_maxPriorityFeePerGas', []);
  extraLatency = tipRes.latencyMs;
  if (!tipRes.error && tipRes.result != null) {
    const p = weiToGwei(tipRes.result as string | number);
    if (Number.isFinite(p) && p > 0) priority = p;
  }

  const effective = base + priority;
  return {
    baseFeeGwei: roundTier(base),
    priorityFeeGwei: roundTier(priority),
    effectiveGwei: roundTier(effective),
    rpcLatencyMs: blockRes.latencyMs + extraLatency,
  };
}

async function fetchGasFromRpc(rpcUrl: string): Promise<{ gwei: number; latencyMs: number } | null> {
  const t0 = performance.now();
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1,
      }),
    });
    const latencyMs = Math.round(performance.now() - t0);
    let data: { error?: unknown; result?: unknown };
    try {
      data = await res.json();
    } catch {
      return null;
    }
    const result = data.result;
    if (!res.ok || data.error || result == null) return null;
    const gwei = weiToGwei(result as string | number);
    return Number.isFinite(gwei) && gwei > 0 ? { gwei, latencyMs } : null;
  } catch {
    return null;
  }
}

async function fetchChainGas(
  chain: (typeof EVM_CHAINS)[number],
  bandByChain: Record<number, SurfBandOverride>
): Promise<ChainGas | null> {
  const custom = bandByChain[chain.chainId];
  for (let i = 0; i < chain.rpcUrls.length; i++) {
    const rpcUrl = chain.rpcUrls[i];
    const host = rpcHostname(rpcUrl);

    if (EIP1559_CHAIN_IDS.has(chain.chainId)) {
      const e1559 = await fetchEip1559Fees(rpcUrl);
      if (e1559 != null && e1559.effectiveGwei > 0 && e1559.effectiveGwei < 1e6) {
        const g = e1559.effectiveGwei;
        const gas: GasTier = {
          slow: roundTier(Math.max(0.001, g * 0.9)),
          standard: roundTier(g),
          fast: roundTier(g * 1.1),
        };
        return {
          chainId: chain.chainId,
          name: chain.name,
          symbol: chain.symbol,
          gas,
          condition: getSurfCondition(gas.standard, chain.chainId, custom),
          updatedAt: Date.now(),
          dataSource: host,
          fetchMeta: {
            rpcAttempts: i + 1,
            rpcUsedHost: host,
            rpcLatencyMs: e1559.rpcLatencyMs,
          },
          eip1559: {
            baseFeeGwei: e1559.baseFeeGwei,
            priorityFeeGwei: e1559.priorityFeeGwei,
          },
        };
      }
    }

    const gasRes = await fetchGasFromRpc(rpcUrl);
    if (gasRes != null && gasRes.gwei > 0 && gasRes.gwei < 1e6) {
      const { gwei, latencyMs } = gasRes;
      const gas: GasTier = {
        slow: roundTier(Math.max(0.001, gwei * 0.9)),
        standard: roundTier(gwei),
        fast: roundTier(gwei * 1.1),
      };
      return {
        chainId: chain.chainId,
        name: chain.name,
        symbol: chain.symbol,
        gas,
        condition: getSurfCondition(gas.standard, chain.chainId, custom),
        updatedAt: Date.now(),
        dataSource: host,
        fetchMeta: { rpcAttempts: i + 1, rpcUsedHost: host, rpcLatencyMs: latencyMs },
      };
    }
  }
  return null;
}

/** Stagger EVM RPC fetches to reduce proxy / rate-limit pressure. */
async function fetchAllEvmStaggered(bandByChain: Record<number, SurfBandOverride>): Promise<(ChainGas | null)[]> {
  const out: (ChainGas | null)[] = [];
  for (let i = 0; i < EVM_CHAINS.length; i += EVM_BATCH_SIZE) {
    const batch = EVM_CHAINS.slice(i, i + EVM_BATCH_SIZE);
    const chunk = await Promise.all(batch.map((c) => fetchChainGas(c, bandByChain)));
    out.push(...chunk);
    if (i + EVM_BATCH_SIZE < EVM_CHAINS.length) {
      await new Promise((r) => setTimeout(r, EVM_BATCH_DELAY_MS));
    }
  }
  return out;
}

function toNum(v: unknown): number {
  if (v == null) return NaN;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

async function fetchBitcoinFees(bandByChain: Record<number, SurfBandOverride>): Promise<ChainGas | null> {
  const custom = bandByChain[BITCOIN_CHAIN_ID];
  try {
    const res = await fetch(MEMPOOL_API);
    const data = (await res.json()) as Record<string, unknown>;
    const hourFee = toNum(data.hourFee ?? data.minimumFee ?? 1);
    const halfHourFee = toNum(data.halfHourFee ?? data.hourFee ?? 1);
    const fastestFee = toNum(data.fastestFee ?? data.halfHourFee ?? 1);
    const economyFee = toNum(data.economyFee);
    const minimumFee = toNum(data.minimumFee);
    const slowVal = Number.isFinite(hourFee) ? Math.round(hourFee) : 1;
    let stdVal = Number.isFinite(halfHourFee) ? Math.round(halfHourFee) : slowVal;
    let fastVal = Number.isFinite(fastestFee) ? Math.round(fastestFee) : stdVal;
    if (slowVal > stdVal) stdVal = slowVal;
    if (stdVal > fastVal) fastVal = stdVal;
    const gas: GasTier = { slow: slowVal, standard: stdVal, fast: fastVal };
    const bitcoinExtras: ChainGas['bitcoinExtras'] = {};
    if (Number.isFinite(economyFee) && economyFee > 0) bitcoinExtras.economyFee = Math.round(economyFee);
    if (Number.isFinite(minimumFee) && minimumFee > 0) bitcoinExtras.minimumFee = Math.round(minimumFee);
    if (Number.isFinite(fastestFee) && fastestFee > 0) bitcoinExtras.fastestFee = Math.round(fastestFee);
    const hasExtras = Object.keys(bitcoinExtras).length > 0;
    return {
      chainId: BITCOIN_CHAIN_ID,
      name: 'Bitcoin',
      symbol: 'BTC',
      gas,
      condition: getSurfCondition(gas.standard, BITCOIN_CHAIN_ID, custom),
      updatedAt: Date.now(),
      dataSource: 'mempool.space',
      fetchMeta: { rpcAttempts: 1, rpcUsedHost: 'mempool.space' },
      bitcoinExtras: hasExtras ? bitcoinExtras : undefined,
    };
  } catch {
    return null;
  }
}

export function useGasPrices(refreshIntervalMs: number) {
  const [chains, setChains] = useState<ChainGas[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<GasPriceErrorKey>(null);
  const [stale, setStale] = useState(false);
  const lastGoodRef = useRef<ChainGas[]>([]);

  const fetchAll = useCallback(async () => {
    setErrorKey(null);
    const bandByChain = loadSurfBandOverrides();
    try {
      const [evmResults, btc] = await Promise.all([
        fetchAllEvmStaggered(bandByChain),
        fetchBitcoinFees(bandByChain),
      ]);
      const valid = evmResults.filter((r): r is ChainGas => r !== null);
      if (btc) valid.push(btc);

      if (valid.length > 0) {
        lastGoodRef.current = valid;
        setStale(false);
        setChains(valid);
        setErrorKey(null);
      } else if (lastGoodRef.current.length > 0) {
        setChains(lastGoodRef.current);
        setStale(true);
        setErrorKey('errorRefreshGas');
      } else {
        setChains([]);
        setStale(false);
        setErrorKey('errorLoadGas');
      }
    } catch {
      if (lastGoodRef.current.length > 0) {
        setChains(lastGoodRef.current);
        setStale(true);
        setErrorKey('errorRefreshGas');
      } else {
        setChains([]);
        setErrorKey('errorLoadGas');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => fetchAll());
    if (refreshIntervalMs <= 0) return;
    const jittered = Math.round(refreshIntervalMs * (0.88 + Math.random() * 0.24));
    const id = setInterval(fetchAll, jittered);
    return () => clearInterval(id);
  }, [fetchAll, refreshIntervalMs]);

  return { chains, loading, errorKey, stale, refetch: fetchAll };
}

export const CHAIN_COINGECKO_IDS: Record<number, string> = {
  ...Object.fromEntries(EVM_CHAINS.map((c) => [c.chainId, c.coinGeckoId])),
  [BITCOIN_CHAIN_ID]: 'bitcoin',
} as Record<number, string>;

export function getCoinGeckoId(chainId: number): string {
  return CHAIN_COINGECKO_IDS[chainId] ?? 'ethereum';
}
