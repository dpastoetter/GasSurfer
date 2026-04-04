import { useState, useEffect } from 'react';
import { loadTicksSince, type FeeTickRow } from '../lib/feeSamplesDb';
import { formatGwei } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface WeeklyRecapModalProps {
  open: boolean;
  onClose: () => void;
}

function analyze(rows: FeeTickRow[]) {
  const ok = rows.filter((r) => !r.stale);
  if (ok.length === 0) return null;
  let bestStd = Infinity;
  let bestName = '';
  for (const r of ok) {
    if (r.cheapestStandard != null && r.cheapestName && r.cheapestStandard < bestStd) {
      bestStd = r.cheapestStandard;
      bestName = r.cheapestName;
    }
  }
  const ethSmooth = ok.filter((r) => r.ethCondition === 'smooth' || r.ethCondition === 'surfs-up').length;
  const ethPct = Math.round((ethSmooth / ok.length) * 100);
  return { samples: ok.length, bestName, bestStd, ethPct };
}

export function WeeklyRecapModal({ open, onClose }: WeeklyRecapModalProps) {
  const { t, ti } = useI18n();
  const [stats, setStats] = useState<ReturnType<typeof analyze>>(null);

  useEffect(() => {
    if (!open) return;
    const since = Date.now() - 7 * 86400_000;
    void loadTicksSince(since).then((rows) => setStats(analyze(rows)));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="weekly-title">
      <div className="w-full max-w-md rounded-2xl glass-strong border border-slate-200/50 dark:border-white/15 shadow-2xl p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 id="weekly-title" className="font-display text-xl tracking-wide text-slate-900 dark:text-white">
            {t('weeklyTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
          >
            {t('weeklyClose')}
          </button>
        </div>
        {!stats || stats.samples === 0 ? (
          <p className="text-sm text-slate-600 dark:text-surf-300/90">{t('weeklyEmpty')}</p>
        ) : (
          <div className="text-sm text-slate-700 dark:text-surf-200 space-y-3">
            <p>
              {ti('weeklySamples', { n: stats.samples })}
            </p>
            {stats.bestName && Number.isFinite(stats.bestStd) && (
              <p>{ti('weeklyBestCheap', { name: stats.bestName, fee: formatGwei(stats.bestStd) })}</p>
            )}
            <p>{ti('weeklyEthSmooth', { pct: stats.ethPct })}</p>
            <p className="text-xs text-slate-500 dark:text-white/45">{t('weeklyDisclaimer')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
