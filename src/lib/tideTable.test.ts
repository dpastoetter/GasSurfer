import { describe, it, expect } from 'vitest';
import { computeTideTable, TIDE_MIN_SAMPLES, formatUtcHourRange } from './tideTable';
import type { FeeTickRow } from './feeSamplesDb';

function tick(ts: number, ethCondition: FeeTickRow['ethCondition']): FeeTickRow {
  return {
    ts,
    stale: false,
    ethStandard: 10,
    ethCondition,
    cheapestChainId: 1,
    cheapestName: 'Ethereum',
    cheapestStandard: 10,
  };
}

describe('computeTideTable', () => {
  it('returns null below minimum samples', () => {
    const rows = Array.from({ length: TIDE_MIN_SAMPLES - 1 }, (_, i) =>
      tick(Date.UTC(2026, 0, 1, 14, i), 'smooth')
    );
    expect(computeTideTable(rows)).toBeNull();
  });

  it('ranks hours with more calm eth conditions higher', () => {
    const base = Date.UTC(2026, 0, 1, 0, 0, 0);
    const rows: FeeTickRow[] = [];
    for (let i = 0; i < TIDE_MIN_SAMPLES; i++) {
      const hour = i % 24;
      const condition = hour === 14 ? 'surfs-up' : 'storm';
      rows.push(tick(base + hour * 3600_000 + i * 1000, condition));
    }
    const result = computeTideTable(rows);
    expect(result).not.toBeNull();
    expect(result!.topCalmHours).toContain(14);
    const h14 = result!.buckets.find((b) => b.hourUtc === 14);
    expect(h14!.calmRatio).toBeGreaterThan(result!.buckets.find((b) => b.hourUtc === 0)!.calmRatio);
  });
});

describe('formatUtcHourRange', () => {
  it('formats single and multiple hours', () => {
    expect(formatUtcHourRange([14])).toBe('14:00 UTC');
    expect(formatUtcHourRange([14, 15])).toBe('14:00–16:00 UTC');
  });
});
