import { useState, useEffect, useRef } from 'react';
import type { ChainGas } from './types';

const DEFAULT_MAX = 24;

/**
 * Keeps a rolling history of the primary chain's standard gas/fee for the mini chart.
 * Resets when the selected chain changes.
 */
export function useChartHistory(primary: ChainGas | undefined, maxSize = DEFAULT_MAX): number[] {
  const [values, setValues] = useState<number[]>([]);
  const prevChainIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!primary) {
      setValues([]);
      prevChainIdRef.current = undefined;
      return;
    }
    if (prevChainIdRef.current !== primary.chainId) {
      prevChainIdRef.current = primary.chainId;
      setValues([primary.gas.standard, primary.gas.standard]);
      return;
    }
    const v = primary.gas.standard;
    setValues((prev) => {
      const next = [...prev.slice(1 - maxSize), v].slice(-maxSize);
      return next.length >= 2 ? next : [v, v];
    });
  }, [primary?.chainId, primary?.gas.standard, maxSize]);

  if (!primary) return [];
  return values.length >= 2 ? values : [primary.gas.standard, primary.gas.standard];
}
