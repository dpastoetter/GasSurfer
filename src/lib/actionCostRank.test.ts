import { describe, it, expect } from 'vitest';
import type { ChainGas } from '../types';
import { rankChainsByActionCost } from './actionCostRank';

const mk = (chainId: number, name: string, standard: number): ChainGas => ({
  chainId,
  name,
  symbol: 'ETH',
  gas: { slow: standard, standard, fast: standard * 1.1 },
  condition: 'smooth',
  updatedAt: Date.now(),
});

describe('rankChainsByActionCost', () => {
  it('sorts by fiat cost ascending', () => {
    const chains = [mk(1, 'Ethereum', 50), mk(8453, 'Base', 0.01)];
    const prices = { ethereum: { usd: 3000 } };
    const ranked = rankChainsByActionCost(chains, prices, 'usd', 21_000);
    expect(ranked[0].chain.chainId).toBe(8453);
    expect(ranked.length).toBe(2);
  });
});
