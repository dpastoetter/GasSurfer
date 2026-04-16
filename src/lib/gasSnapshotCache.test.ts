import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ChainGas } from '../types';
import { saveGasSnapshotCache, loadGasSnapshotCache, snapshotRowsToChainGas } from './gasSnapshotCache';
import { buildChainsSnapshotPayload } from './snapshotJson';

describe('gasSnapshotCache', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: () => null,
      length: 0,
    } as Storage);
  });

  it('roundtrips snapshot', () => {
    const chains: ChainGas[] = [
      {
        chainId: 1,
        name: 'Ethereum',
        symbol: 'ETH',
        gas: { slow: 1, standard: 2, fast: 3 },
        condition: 'smooth',
        updatedAt: 1_700_000_000_000,
        dataSource: 'example.com',
        fetchMeta: { rpcAttempts: 2, rpcUsedHost: 'example.com' },
      },
    ];
    const payload = buildChainsSnapshotPayload(chains, false);
    saveGasSnapshotCache(payload);
    const loaded = loadGasSnapshotCache();
    expect(loaded?.chains).toHaveLength(1);
    expect(loaded?.chains[0].gas.standard).toBe(2);
    const round = snapshotRowsToChainGas(loaded!.chains);
    expect(round[0].fetchMeta?.rpcAttempts).toBe(2);
  });
});
