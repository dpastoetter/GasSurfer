import type { FeeTickRow } from './feeSamplesDb';
import type { SurfCondition } from '../types';

export const TIDE_MIN_SAMPLES = 48;
const CALM: SurfCondition[] = ['surfs-up', 'smooth'];

export type TideHourBucket = {
  hourUtc: number;
  calmRatio: number;
  sampleCount: number;
};

export type TideTableResult = {
  buckets: TideHourBucket[];
  topCalmHours: number[];
  totalSamples: number;
};

function isCalm(condition: SurfCondition | null): boolean {
  return condition != null && CALM.includes(condition);
}

/**
 * Ethereum-only calm-hour histogram from device fee ticks (UTC hour buckets).
 */
export function computeTideTable(rows: FeeTickRow[]): TideTableResult | null {
  const ok = rows.filter((r) => !r.stale && r.ethCondition != null);
  if (ok.length < TIDE_MIN_SAMPLES) return null;

  const byHour = new Map<number, { calm: number; total: number }>();
  for (let h = 0; h < 24; h++) byHour.set(h, { calm: 0, total: 0 });

  for (const r of ok) {
    const h = new Date(r.ts).getUTCHours();
    const slot = byHour.get(h)!;
    slot.total += 1;
    if (isCalm(r.ethCondition)) slot.calm += 1;
  }

  const buckets: TideHourBucket[] = [];
  for (let hourUtc = 0; hourUtc < 24; hourUtc++) {
    const { calm, total } = byHour.get(hourUtc)!;
    buckets.push({
      hourUtc,
      calmRatio: total > 0 ? calm / total : 0,
      sampleCount: total,
    });
  }

  const ranked = [...buckets]
    .filter((b) => b.sampleCount > 0)
    .sort((a, b) => b.calmRatio - a.calmRatio || b.sampleCount - a.sampleCount);
  const topCalmHours = ranked.slice(0, 3).map((b) => b.hourUtc);

  return { buckets, topCalmHours, totalSamples: ok.length };
}

export function formatUtcHourRange(hours: number[]): string {
  if (hours.length === 0) return '';
  const sorted = [...hours].sort((a, b) => a - b);
  const fmt = (h: number) => `${String(h).padStart(2, '0')}:00`;
  if (sorted.length === 1) return `${fmt(sorted[0])} UTC`;
  return `${fmt(sorted[0])}–${fmt((sorted[sorted.length - 1]! + 1) % 24)} UTC`;
}
