import { useEffect } from 'react';
import type { ChainGas } from '../types';
import { buildChainsSnapshotPayload } from '../lib/snapshotJson';

/**
 * When the optional API is reachable (same origin proxy or VITE_API_URL), POST fee snapshots for server-side history / snapshot.json.
 */
export function useServerTickReporter(chains: ChainGas[], stale: boolean, fingerprint: string) {
  useEffect(() => {
    if (chains.length === 0 || typeof fetch === 'undefined') return;
    const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
    const url = `${base || ''}/api/ticks`;
    const payload = buildChainsSnapshotPayload(chains, stale);
    const ac = new AbortController();
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ac.signal,
    }).catch(() => {
      /* optional backend */
    });
    return () => ac.abort();
    // `fingerprint` already encodes chain fees + stale; avoids POST every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [fingerprint]);
}
