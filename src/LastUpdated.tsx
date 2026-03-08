import { useState, useEffect } from 'react';

interface LastUpdatedProps {
  timestamp: number;
  className?: string;
}

function formatRelative(ms: number): string {
  if (ms < 1000) return 'just now';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function LastUpdated({ timestamp, className = '' }: LastUpdatedProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ago = formatRelative(now - timestamp);
  return (
    <span className={className} title={new Date(timestamp).toLocaleString()}>
      Updated {ago}
    </span>
  );
}
