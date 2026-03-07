import { useState, useEffect } from 'react';
import type { ChainGas } from './types';
import { pushSample, getAllAverages, type FeeAverages } from './feeHistory';

export function useFeeAverages(chains: ChainGas[]): Record<number, FeeAverages> {
  const [averages, setAverages] = useState<Record<number, FeeAverages>>({});

  useEffect(() => {
    if (!chains?.length) return;
    try {
      for (const chain of chains) {
        if (chain?.gas?.standard != null && Number.isFinite(chain.gas.standard)) {
          pushSample(chain.chainId, chain.gas.standard, chain.updatedAt ?? Date.now());
        }
      }
      setAverages(getAllAverages(chains.map((c) => c.chainId)));
    } catch {
      // ignore localStorage or parse errors
    }
  }, [chains]);

  return averages;
}
