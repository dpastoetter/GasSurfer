import { useMemo } from 'react';

interface MiniChartProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}

export function MiniChart({
  values,
  width = 280,
  height = 64,
  color = 'rgba(14, 181, 216, 0.8)',
  label = 'Gas (gwei)',
}: MiniChartProps) {
  const path = useMemo(() => {
    if (values.length < 2) return '';
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = max - min || 1;
    const padding = 8;
    const w = width - padding * 2;
    const h = height - padding * 2;
    const step = w / (values.length - 1);
    const points = values.map((v, i) => {
      const x = padding + i * step;
      const y = padding + h - ((v - min) / range) * h;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [values, width, height]);

  return (
    <div className="rounded-xl glass p-4">
      <p className="text-white/60 text-xs font-medium mb-2">{label}</p>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="chartGrad" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-in fade-in duration-500"
        />
        <path
          d={`${path} L ${width - 8},${height - 8} L 8,${height - 8} Z`}
          fill="url(#chartGrad)"
        />
      </svg>
    </div>
  );
}
