interface MicroSparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  'aria-label'?: string;
}

/** Tiny inline SVG trend; expects at least 2 numeric samples. */
export function MicroSparkline({
  values,
  width = 72,
  height = 22,
  className = '',
  'aria-label': ariaLabel,
}: MicroSparklineProps) {
  if (values.length < 2) return <span className={`inline-block ${className}`} style={{ width, height }} aria-hidden />;

  const min = Math.min(...values);
  const max = Math.max(...values, min + 1e-9);
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * w;
    const y = pad + h - ((v - min) / (max - min)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const d = `M ${pts.join(' L ')}`;

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-surf-500 dark:text-surf-300 opacity-80"
      />
    </svg>
  );
}
