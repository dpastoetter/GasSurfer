import type { FeeAverages } from './feeHistory';
import { formatGwei } from './types';
import { useI18n } from './i18n/I18nContext';

interface FeeAveragesDisplayProps {
  averages: FeeAverages | null | undefined;
  unitLabel: string;
  compact?: boolean;
  /** When true and all windows are empty, show hint about backend / daily samples */
  showExplainerWhenEmpty?: boolean;
}

export function FeeAveragesDisplay({
  averages,
  unitLabel,
  compact,
  showExplainerWhenEmpty,
}: FeeAveragesDisplayProps) {
  const { t } = useI18n();
  if (!averages) return null;
  const { avg7d, avg30d, avg90d, avg180d } = averages;
  const hasAny = avg7d != null || avg30d != null || avg90d != null || avg180d != null;

  if (!hasAny) {
    if (!showExplainerWhenEmpty) return null;
    return (
      <div className="mt-3 rounded-xl border border-dashed border-slate-300/60 dark:border-white/15 px-3 py-2 text-left">
        <p className="text-slate-600 dark:text-surf-300 text-xs font-medium">{t('averagesBuildingTitle')}</p>
        <p className="text-slate-500 dark:text-white/45 text-[11px] mt-1 leading-snug">{t('averagesBuildingBody')}</p>
      </div>
    );
  }

  const parts: { label: string; value: number }[] = [];
  if (avg7d != null) parts.push({ label: '7d', value: avg7d });
  if (avg30d != null) parts.push({ label: '30d', value: avg30d });
  if (avg90d != null) parts.push({ label: '90d', value: avg90d });
  if (avg180d != null) parts.push({ label: '180d', value: avg180d });
  if (parts.length === 0) return null;

  if (compact) {
    return (
      <p className="text-slate-500 dark:text-white/50 text-xs mt-2">
        {t('avgPrefix')}{' '}
        {parts.map((p, i) => (
          <span key={p.label}>
            {i > 0 && ' · '}
            {p.label}: <span className="text-surf-700 dark:text-foam font-mono">{formatGwei(p.value)}</span>
          </span>
        ))}{' '}
        {unitLabel}
      </p>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
      <p className="text-slate-500 dark:text-white/50 text-xs mb-1.5">{t('avgFeeStandard')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
        {parts.map((p) => (
          <span key={p.label}>
            {p.label}: <span className="text-surf-700 dark:text-foam font-mono">{formatGwei(p.value)}</span> {unitLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
