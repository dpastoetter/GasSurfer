import type { FeeAverages } from './feeHistory';
import { formatGwei } from './types';

interface FeeAveragesDisplayProps {
  averages: FeeAverages | null | undefined;
  unitLabel: string;
  compact?: boolean;
}

export function FeeAveragesDisplay({ averages, unitLabel, compact }: FeeAveragesDisplayProps) {
  if (!averages) return null;
  const { avg7d, avg30d, avg90d, avg180d } = averages;
  const hasAny = avg7d != null || avg30d != null || avg90d != null || avg180d != null;
  if (!hasAny) return null;

  const parts: { label: string; value: number }[] = [];
  if (avg7d != null) parts.push({ label: '7d', value: avg7d });
  if (avg30d != null) parts.push({ label: '30d', value: avg30d });
  if (avg90d != null) parts.push({ label: '90d', value: avg90d });
  if (avg180d != null) parts.push({ label: '180d', value: avg180d });
  if (parts.length === 0) return null;

  if (compact) {
    return (
      <p className="text-white/50 text-xs mt-2">
        Avg {parts.map((p, i) => (
          <span key={p.label}>
            {i > 0 && ' · '}
            {p.label}: <span className="text-foam font-mono">{formatGwei(p.value)}</span>
          </span>
        ))} {unitLabel}
      </p>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <p className="text-white/50 text-xs mb-1.5">Average fee (standard)</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
        {parts.map((p) => (
          <span key={p.label}>
            {p.label}: <span className="text-foam font-mono">{formatGwei(p.value)}</span> {unitLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
