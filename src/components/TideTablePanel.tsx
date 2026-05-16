import { useState, useEffect } from 'react';
import { loadTicksSince } from '../lib/feeSamplesDb';
import { computeTideTable, formatUtcHourRange, type TideTableResult } from '../lib/tideTable';
import { useI18n } from '../i18n/I18nContext';

export function TideTablePanel() {
  const { t, ti } = useI18n();
  const [data, setData] = useState<TideTableResult | null>(null);

  useEffect(() => {
    const since = Date.now() - 7 * 86400_000;
    void loadTicksSince(since).then((rows) => setData(computeTideTable(rows)));
  }, []);

  if (data == null) return null;

  const calmPct = (ratio: number) => `${Math.round(ratio * 100)}%`;

  return (
    <details className="mb-6 rounded-2xl glass border border-slate-200/50 dark:border-white/10 text-sm group">
      <summary className="cursor-pointer list-none px-4 py-3 font-medium text-slate-800 dark:text-surf-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50 rounded-2xl">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>🌊</span>
          {t('tideTableTitle')}
        </span>
      </summary>
      <div className="px-4 pb-4 border-t border-slate-200/40 dark:border-white/10">
        <p className="text-xs text-slate-500 dark:text-white/45 mt-3 mb-3 leading-relaxed">{t('tideTableDisclaimer')}</p>
        {data.topCalmHours.length > 0 && (
          <p className="text-slate-700 dark:text-surf-200 mb-3">
            {ti('tideTableCalmSummary', { range: formatUtcHourRange(data.topCalmHours) })}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <caption className="sr-only">{t('tideTableCaption')}</caption>
            <thead>
              <tr className="text-slate-500 dark:text-white/50 border-b border-slate-200/50 dark:border-white/10">
                <th scope="col" className="py-2 pr-3 font-medium">
                  {t('tideTableColHour')}
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  {t('tideTableColCalm')}
                </th>
                <th scope="col" className="py-2 font-medium">
                  {t('tideTableColSamples')}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.buckets
                .filter((b) => b.sampleCount > 0)
                .sort((a, b) => a.hourUtc - b.hourUtc)
                .map((b) => (
                  <tr key={b.hourUtc} className="border-b border-slate-100/60 dark:border-white/5">
                    <td className="py-1.5 pr-3 font-mono">{String(b.hourUtc).padStart(2, '0')}:00 UTC</td>
                    <td className="py-1.5 pr-3">{calmPct(b.calmRatio)}</td>
                    <td className="py-1.5">{b.sampleCount}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-white/35 mt-2">
          {ti('tideTableSampleNote', { n: data.totalSamples })}
        </p>
      </div>
    </details>
  );
}
