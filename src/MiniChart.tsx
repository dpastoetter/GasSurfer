import { useMemo, useId, useState } from 'react';
import { useI18n } from './i18n/I18nContext';
import { interpolate } from './i18n/messages';
import { formatGwei } from './types';

interface MiniChartProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  referenceValue?: number | null;
}

function logMap(v: number, minPos: number): number {
  const x = Math.max(v, minPos);
  return Math.log10(x);
}

export function MiniChart({
  values,
  width = 280,
  height = 64,
  color = 'rgba(14, 181, 216, 0.8)',
  label = 'Gas (gwei)',
  referenceValue,
}: MiniChartProps) {
  const { t } = useI18n();
  const gradId = useId().replace(/:/g, '');
  const [logScale, setLogScale] = useState(false);

  const { path, min, max, padding, h, last } = useMemo(() => {
    const padding = 8;
    const w = width - padding * 2;
    const h = height - padding * 2;
    if (values.length < 2) return { path: '', min: 0, max: 1, padding, h, last: 0 };
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values, 1);
    const last = values[values.length - 1] ?? rawMax;

    let min = rawMin;
    let max = rawMax;
    let map = (v: number) => v;
    if (logScale && rawMin > 0 && rawMax > 0) {
      const minPos = Math.max(rawMin * 0.5, 1e-9);
      min = logMap(rawMin, minPos);
      max = logMap(rawMax, minPos);
      map = (v) => logMap(v, minPos);
    }
    const range = max - min || 1;
    const step = w / (values.length - 1);
    const points = values.map((v, i) => {
      const x = padding + i * step;
      const mv = logScale ? map(v) : v;
      const y = padding + h - ((mv - min) / range) * h;
      return `${x},${y}`;
    });
    return { path: `M ${points.join(' L ')}`, min: rawMin, max: rawMax, padding, h, last };
  }, [values, width, height, logScale]);

  const refY =
    referenceValue != null && Number.isFinite(referenceValue) && path
      ? (() => {
          let minV = Math.min(...values);
          let maxV = Math.max(...values, 1);
          let ref = referenceValue;
          if (logScale && minV > 0 && maxV > 0) {
            const minPos = Math.max(minV * 0.5, 1e-9);
            minV = logMap(minV, minPos);
            maxV = logMap(maxV, minPos);
            ref = logMap(referenceValue, minPos);
          }
          const range = maxV - minV || 1;
          return padding + h - ((ref - minV) / range) * h;
        })()
      : null;

  const rangeText = interpolate(t('chartRange'), {
    min: formatGwei(min),
    max: formatGwei(max),
    last: formatGwei(last),
  });

  return (
    <div className="rounded-xl glass p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-slate-500 dark:text-white/60 text-xs font-medium">{label}</p>
        <div className="flex rounded-lg border border-slate-300/40 dark:border-white/15 overflow-hidden text-[10px]">
          <button
            type="button"
            onClick={() => setLogScale(false)}
            className={`px-2 py-1 ${!logScale ? 'bg-surf-500/30 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-white/50'}`}
            aria-pressed={!logScale}
          >
            {t('chartLinear')}
          </button>
          <button
            type="button"
            onClick={() => setLogScale(true)}
            className={`px-2 py-1 ${logScale ? 'bg-surf-500/30 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-white/50'}`}
            aria-pressed={logScale}
          >
            {t('chartLog')}
          </button>
        </div>
      </div>
      <svg width={width} height={height} className="overflow-visible" role="img" aria-label={rangeText}>
        <title>{rangeText}</title>
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {refY != null && refY >= padding && refY <= height - padding && (
          <line
            x1={padding}
            y1={refY}
            x2={width - padding}
            y2={refY}
            stroke="currentColor"
            className="text-slate-400 dark:text-white/35"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-in fade-in duration-500"
        />
        {path && (
          <path
            d={`${path} L ${width - 8},${height - 8} L 8,${height - 8} Z`}
            fill={`url(#${gradId})`}
          />
        )}
      </svg>
      <p className="text-slate-500 dark:text-white/50 text-[10px] mt-1 font-mono">{rangeText}</p>
      {refY != null && (
        <p className="text-slate-400 dark:text-white/40 text-[10px] mt-0.5">{t('chart7dHint')}</p>
      )}
    </div>
  );
}
