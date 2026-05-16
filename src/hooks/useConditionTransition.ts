import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChainGas, SurfCondition } from '../types';

const AUTO_HIDE_MS = 6000;

export type ConditionTransitionToast = {
  chainName: string;
  from: SurfCondition;
  to: SurfCondition;
  improved: boolean;
};

/**
 * When the selected chain's surf condition changes after initial load, surface a short toast payload.
 */
export function useConditionTransition(chain: ChainGas | undefined): {
  toast: ConditionTransitionToast | null;
  dismiss: () => void;
} {
  const [toast, setToast] = useState<ConditionTransitionToast | null>(null);
  const prevRef = useRef<SurfCondition | undefined>(undefined);

  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!chain) {
      prevRef.current = undefined;
      return;
    }
    const prev = prevRef.current;
    prevRef.current = chain.condition;
    if (prev === undefined || prev === chain.condition) return;

    const rank: Record<SurfCondition, number> = {
      'surfs-up': 0,
      smooth: 1,
      choppy: 2,
      storm: 3,
    };
    const improved = rank[chain.condition] < rank[prev];
    setToast({
      chainName: chain.name,
      from: prev,
      to: chain.condition,
      improved,
    });
  }, [chain, chain?.condition, chain?.name]);

  useEffect(() => {
    if (toast == null) return;
    const t = window.setTimeout(() => setToast(null), AUTO_HIDE_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  return { toast, dismiss };
}
