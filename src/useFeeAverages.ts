import { useState, useEffect, useCallback } from 'react';
import type { ChainGas } from './types';
import type { FeeAverages } from './feeHistory';
import { postSamples, getAverages } from './api/averages';

export function useFeeAverages(chains: ChainGas[]): Record<number, FeeAverages> {
  const [averages, setAverages] = useState<Record<number, FeeAverages>>({});

  const fetchAverages = useCallback(async (chainIds: number[]) => {
    if (chainIds.length === 0) return;
    try {
      const data = await getAverages(chainIds);
      setAverages(data);
    } catch {
      setAverages((prev) => prev);
    }
  }, []);

  useEffect(() => {
    if (!chains?.length) return;

    const chainIds = chains.map((c) => c.chainId);
    const samples = chains
      .filter((c) => c?.gas?.standard != null && Number.isFinite(c.gas.standard))
      .map((c) => ({
        chainId: c.chainId,
        value: c.gas.standard,
        timestamp: c.updatedAt ?? Date.now(),
      }));

    let cancelled = false;

    (async () => {
      try {
        await postSamples(samples);
        if (cancelled) return;
        await fetchAverages(chainIds);
      } catch {
        if (!cancelled) fetchAverages(chainIds).catch(() => {});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chains, fetchAverages]);

  return averages;
}
