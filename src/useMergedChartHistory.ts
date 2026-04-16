import { useState, useEffect, useMemo } from 'react';
import type { ChainGas } from './types';
import type { ChainsSnapshotPayload } from './lib/snapshotJson';
import { useChartHistory } from './useChartHistory';

type TickRow = { createdAt?: number; snapshot: ChainsSnapshotPayload | null };

function extractSeries(ticks: TickRow[], chainId: number): number[] {
  const out: number[] = [];
  for (const t of ticks) {
    if (!t.snapshot?.chains) continue;
    const c = t.snapshot.chains.find((x) => x.chainId === chainId);
    if (c && Number.isFinite(c.gas.standard)) out.push(c.gas.standard);
  }
  return out;
}

/**
 * Rolling standard-fee history for the mini chart, optionally prefixed with points from `GET /api/ticks/recent` when the optional API has data.
 */
export function useMergedChartHistory(
  primary: ChainGas | undefined,
  maxSize: number
): { values: number[]; hasServerBlend: boolean } {
  const local = useChartHistory(primary, maxSize);
  const [serverPrefix, setServerPrefix] = useState<number[]>([]);

  useEffect(() => {
    if (!primary) {
      queueMicrotask(() => setServerPrefix([]));
      return;
    }
    const chainId = primary.chainId;
    const ac = new AbortController();
    const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
    const url = `${base || ''}/api/ticks/recent?limit=80`;
    void fetch(url, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((data: { ticks?: TickRow[] }) => {
        if (ac.signal.aborted) return;
        const ticks = Array.isArray(data.ticks) ? data.ticks : [];
        setServerPrefix(extractSeries(ticks, chainId));
      })
      .catch(() => {
        if (!ac.signal.aborted) setServerPrefix([]);
      });
    return () => {
      ac.abort();
      queueMicrotask(() => setServerPrefix([]));
    };
  }, [primary]);

  return useMemo(() => {
    if (!primary) return { values: [], hasServerBlend: false };
    const hasBlend = serverPrefix.length >= 2;
    if (!hasBlend) return { values: local, hasServerBlend: false };
    const merged = [...serverPrefix, ...local].slice(-maxSize);
    return { values: merged.length >= 2 ? merged : local, hasServerBlend: true };
  }, [primary, local, serverPrefix, maxSize]);
}
