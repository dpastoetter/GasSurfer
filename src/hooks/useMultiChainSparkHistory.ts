import { useReducer, useEffect } from 'react';
import type { ChainGas } from '../types';

type SparkState = { snap: string; byChain: Record<number, number[]> };

function sparkReducer(
  state: SparkState,
  action: { type: 'sync'; snap: string; chains: ChainGas[]; maxPerChain: number }
): SparkState {
  if (action.snap === state.snap) return state;
  const next: Record<number, number[]> = { ...state.byChain };
  for (const c of action.chains) {
    const arr = next[c.chainId] ?? [];
    next[c.chainId] = [...arr, c.gas.standard].slice(-action.maxPerChain);
  }
  return { snap: action.snap, byChain: next };
}

/**
 * Rolling standard-fee history per chain for micro sparklines (client session).
 */
export function useMultiChainSparkHistory(chains: ChainGas[], maxPerChain = 18) {
  const snap = chains.map((c) => `${c.chainId}:${c.gas.standard}:${c.updatedAt}`).join('|');
  const [state, dispatch] = useReducer(sparkReducer, { snap: '', byChain: {} });

  useEffect(() => {
    if (chains.length === 0) return;
    dispatch({ type: 'sync', snap, chains, maxPerChain });
  }, [snap, chains, maxPerChain]);

  return state.byChain;
}
