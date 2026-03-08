import { useMemo } from 'react';

interface MiniChartProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  /** Optional 7d average to show as a reference line */
  referenceValue?: number | null;
}

export function MiniChart({
  values,
  width = 280,
  height = 64,
  color = 'rgba(14, 181, 216, 0.8)',
  label = 'Gas (gwei)',
  referenceValue,
}: MiniChartProps) {
  const { path, min, max, padding, h } = useMemo(() => {
    const padding = 8;
    const w = width - padding * 2;
    const h = height - padding * 2;
    if (values.length < 2) return { path: '', min: 0, max: 1, padding, h };
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = max - min || 1;
    const step = w / (values.length - 1);
    const points = values.map((v, i) => {
      const x = padding + i * step;
      const y = padding + h - ((v - min) / range) * h;
      return `${x},${y}`;
    });
    return { path: `M ${points.join(' L ')}`, min, max, padding, h };
  }, [values, width, height]);

  const refY =
    referenceValue != null && Number.isFinite(referenceValue) && path
      ? padding + h - ((referenceValue - min) / (max - min || 1)) * h
      : null;

  return (
    <div className="rounded-xl glass p-4">
      <p className="text-slate-500 dark:text-white/60 text-xs font-medium mb-2">{label}</p>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="chartGrad" x1="0" x2="0" y1="1" y2="0">
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
            fill="url(#chartGrad)"
          />
        )}
      </svg>
      {refY != null && (
        <p className="text-slate-400 dark:text-white/40 text-[10px] mt-1">— dashed line: 7d avg</p>
      )}
    </div>
  );
}
