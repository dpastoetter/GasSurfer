import { useState, useEffect, useRef } from 'react';
import type { ChainGas, SurfCondition } from '../types';

/**
 * Short celebratory state when a favorite chain's condition becomes surfs-up.
 */
export function useDelightSurfsUp(chain: ChainGas | undefined, isFavorite: boolean): boolean {
  const [burst, setBurst] = useState(false);
  const prevRef = useRef<SurfCondition | undefined>(undefined);

  useEffect(() => {
    if (!chain || !isFavorite) {
      prevRef.current = chain?.condition;
      return;
    }
    const prev = prevRef.current;
    prevRef.current = chain.condition;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (prev !== undefined && prev !== 'surfs-up' && chain.condition === 'surfs-up') {
      const raf = requestAnimationFrame(() => {
        setBurst(true);
      });
      const t = window.setTimeout(() => setBurst(false), 1400);
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(t);
      };
    }
  }, [chain, chain?.condition, isFavorite]);

  return burst;
}
