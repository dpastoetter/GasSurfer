import type { ChainGas, SurfCondition } from '../types';
import type { ChainSnapshotRow, ChainsSnapshotPayload } from './snapshotJson';

const STORAGE_KEY = 'gas-surfer-last-snapshot-v1';

export function saveGasSnapshotCache(payload: ChainsSnapshotPayload): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function loadGasSnapshotCache(): ChainsSnapshotPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as ChainsSnapshotPayload;
    if (!p || !Array.isArray(p.chains) || p.chains.length === 0) return null;
    return p;
  } catch {
    return null;
  }
}

export function snapshotRowsToChainGas(rows: ChainSnapshotRow[]): ChainGas[] {
  return rows.map((r) => ({
    chainId: r.chainId,
    name: r.name,
    symbol: r.symbol,
    gas: r.gas,
    condition: r.condition as SurfCondition,
    updatedAt: r.updatedAt,
    dataSource: r.dataSource ?? undefined,
    fetchMeta: r.fetchMeta ?? undefined,
    eip1559: r.eip1559 ?? undefined,
    bitcoinExtras: r.bitcoinExtras ?? undefined,
  }));
}
