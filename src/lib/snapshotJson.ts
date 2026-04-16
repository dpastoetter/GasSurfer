import type { ChainGas, RpcFetchMeta } from '../types';

export type ChainSnapshotRow = {
  chainId: number;
  name: string;
  symbol: string;
  condition: string;
  gas: { slow: number; standard: number; fast: number };
  updatedAt: number;
  dataSource: string | null;
  fetchMeta?: RpcFetchMeta | null;
  eip1559: { baseFeeGwei: number; priorityFeeGwei: number } | null;
  bitcoinExtras: ChainGas['bitcoinExtras'] | null;
};

export type ChainsSnapshotPayload = {
  generatedAt: number;
  stale: boolean;
  chains: ChainSnapshotRow[];
};

export function buildChainsSnapshotPayload(chains: ChainGas[], stale: boolean): ChainsSnapshotPayload {
  return {
    generatedAt: Date.now(),
    stale,
    chains: chains.map((c) => ({
      chainId: c.chainId,
      name: c.name,
      symbol: c.symbol,
      condition: c.condition,
      gas: { ...c.gas },
      updatedAt: c.updatedAt,
      dataSource: c.dataSource ?? null,
      fetchMeta: c.fetchMeta ? { ...c.fetchMeta } : null,
      eip1559: c.eip1559 ? { ...c.eip1559 } : null,
      bitcoinExtras: c.bitcoinExtras ? { ...c.bitcoinExtras } : null,
    })),
  };
}
