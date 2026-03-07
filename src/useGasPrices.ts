import { useState, useEffect, useCallback } from 'react';
import type { ChainGas, GasTier, SurfCondition } from './types';
import { BITCOIN_CHAIN_ID } from './types';
import { EVM_CHAINS, MEMPOOL_API } from './config/chains';

function getCondition(standardFee: number, chainId: number): SurfCondition {
  if (chainId === BITCOIN_CHAIN_ID) {
    const low = 5, mid = 15, high = 50;
    if (standardFee <= low) return 'surfs-up';
    if (standardFee <= mid) return 'smooth';
    if (standardFee <= high) return 'choppy';
    return 'storm';
  }
  const isL2 = ![1, 137, 56, 43114, 250, 100, 42220].includes(chainId);
  const low = isL2 ? 0.05 : chainId === 56 ? 3 : chainId === 137 ? 30 : chainId === 43114 ? 25 : chainId === 250 ? 1 : chainId === 100 ? 1 : 20;
  const mid = isL2 ? 0.2 : chainId === 56 ? 5 : chainId === 137 ? 50 : chainId === 43114 ? 50 : chainId === 250 ? 5 : chainId === 100 ? 2 : 50;
  const high = isL2 ? 0.5 : chainId === 56 ? 10 : chainId === 137 ? 80 : chainId === 43114 ? 100 : chainId === 250 ? 10 : chainId === 100 ? 5 : 80;
  if (standardFee <= low) return 'surfs-up';
  if (standardFee <= mid) return 'smooth';
  if (standardFee <= high) return 'choppy';
  return 'storm';
}

/**
 * Converts eth_gasPrice result to gwei.
 * Spec: result is hex string in wei. Some RPCs return a number instead;
 * if it's small (< 1e9) it's likely already gwei (e.g. Gnosis 2.9, L2s 0.001).
 */
function weiToGwei(result: string | number): number {
  if (typeof result === 'number') {
    if (result >= 1e9) return result / 1e9; // wei
    return result; // already gwei (common for some L2 / Gnosis RPCs)
  }
  const wei = result.startsWith('0x') ? parseInt(result, 16) : parseInt(result, 10);
  return wei / 1e9;
}

async function fetchGasFromRpc(rpcUrl: string): Promise<number | null> {
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
    let data: { error?: unknown; result?: unknown };
    try {
      data = await res.json();
    } catch {
      return null;
    }
    const result = data.result;
    if (!res.ok || data.error || result == null) return null;
    const gwei = weiToGwei(result as string | number);
    return Number.isFinite(gwei) && gwei > 0 ? gwei : null;
  } catch {
    return null;
  }
}

async function fetchChainGas(chain: (typeof EVM_CHAINS)[number]): Promise<ChainGas | null> {
  for (let i = 0; i < chain.rpcUrls.length; i++) {
    const gwei = await fetchGasFromRpc(chain.rpcUrls[i]);
    if (gwei != null && gwei > 0 && gwei < 1e6) {
      const round = (n: number) => (n >= 1 ? Math.round(n) : Math.round(n * 100) / 100);
      const gas: GasTier = {
        slow: round(Math.max(0.001, gwei * 0.9)),
        standard: round(gwei),
        fast: round(gwei * 1.1),
      };
      return {
        chainId: chain.chainId,
        name: chain.name,
        symbol: chain.symbol,
        gas,
        condition: getCondition(gas.standard, chain.chainId),
        updatedAt: Date.now(),
      };
    }
  }
  return null;
}

function toNum(v: unknown): number {
  if (v == null) return NaN;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

async function fetchBitcoinFees(): Promise<ChainGas | null> {
  try {
    const res = await fetch(MEMPOOL_API);
    const data = await res.json();
    const hourFee = toNum(data.hourFee ?? data.minimumFee ?? 1);
    const halfHourFee = toNum(data.halfHourFee ?? data.hourFee ?? 1);
    const fastestFee = toNum(data.fastestFee ?? data.halfHourFee ?? 1);
    let slowVal = Number.isFinite(hourFee) ? Math.round(hourFee) : 1;
    let stdVal = Number.isFinite(halfHourFee) ? Math.round(halfHourFee) : slowVal;
    let fastVal = Number.isFinite(fastestFee) ? Math.round(fastestFee) : stdVal;
    // Ensure slow ≤ standard ≤ fast (API can occasionally be out of order)
    if (slowVal > stdVal) stdVal = slowVal;
    if (stdVal > fastVal) fastVal = stdVal;
    const gas: GasTier = { slow: slowVal, standard: stdVal, fast: fastVal };
    return {
      chainId: BITCOIN_CHAIN_ID,
      name: 'Bitcoin',
      symbol: 'BTC',
      gas,
      condition: getCondition(gas.standard, BITCOIN_CHAIN_ID),
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export function useGasPrices(refreshIntervalMs = 12_000) {
  const [chains, setChains] = useState<ChainGas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    const [evmResults, btc] = await Promise.all([
      Promise.all(EVM_CHAINS.map(fetchChainGas)),
      fetchBitcoinFees(),
    ]);
    const valid = evmResults.filter((r): r is ChainGas => r !== null);
    if (btc) valid.push(btc);
    setChains(valid);
    if (valid.length === 0) setError('Could not load gas prices');
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, refreshIntervalMs);
    return () => clearInterval(id);
  }, [fetchAll, refreshIntervalMs]);

  return { chains, loading, error, refetch: fetchAll };
}

export const CHAIN_COINGECKO_IDS: Record<number, string> = {
  ...Object.fromEntries(EVM_CHAINS.map((c) => [c.chainId, c.coinGeckoId])),
  [BITCOIN_CHAIN_ID]: 'bitcoin',
} as Record<number, string>;

export function getCoinGeckoId(chainId: number): string {
  return CHAIN_COINGECKO_IDS[chainId] ?? 'ethereum';
}
