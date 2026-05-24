import { describe, it, expect } from 'vitest';
import { computeSendWindowScore } from './sendWindowScore';

describe('computeSendWindowScore', () => {
  it('returns great when surfs-up, below 7d avg, and calm hour', () => {
    const r = computeSendWindowScore({
      condition: 'surfs-up',
      standardFee: 10,
      avg7d: 20,
      calmHourNow: true,
    });
    expect(r.verdict).toBe('great');
    expect(r.score).toBeGreaterThanOrEqual(55);
  });

  it('returns wait for storm with high vs average', () => {
    const r = computeSendWindowScore({
      condition: 'storm',
      standardFee: 100,
      avg7d: 50,
      hasCheaperChain: true,
    });
    expect(r.verdict).toBe('wait');
  });

  it('penalizes cheaper chain elsewhere', () => {
    const withCheaper = computeSendWindowScore({
      condition: 'smooth',
      standardFee: 15,
      avg7d: 20,
      hasCheaperChain: true,
    });
    const without = computeSendWindowScore({
      condition: 'smooth',
      standardFee: 15,
      avg7d: 20,
      hasCheaperChain: false,
    });
    expect(withCheaper.score).toBeLessThan(without.score);
  });
});
