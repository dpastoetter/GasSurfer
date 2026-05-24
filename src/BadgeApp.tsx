import { useEffect } from 'react';
import { useGasPrices } from './useGasPrices';
import { conditionLabels } from './i18n/messages';
import type { SurfCondition } from './types';

const CONDITION_COLOR: Record<SurfCondition, string> = {
  'surfs-up': '#10b981',
  smooth: '#26c6da',
  choppy: '#f59e0b',
  storm: '#ef4444',
};

type BadgeAppProps = {
  chainId: number;
};

/** Renders an SVG badge for READMEs: `/badge/1` */
export default function BadgeApp({ chainId }: BadgeAppProps) {
  const { chains, loading } = useGasPrices(30_000);
  const chain = chains.find((c) => c.chainId === chainId);

  useEffect(() => {
    if (loading && !chain) return;
    const label = chain ? conditionLabels('en')[chain.condition].label : '…';
    const color = chain ? CONDITION_COLOR[chain.condition] : '#64748b';
    const name = chain?.name ?? `Chain ${chainId}`;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="40" role="img" aria-label="Gas Surfer ${name}: ${label}">
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#011118"/>
    <stop offset="100%" stop-color="#0a3d4a"/>
  </linearGradient>
  <rect width="320" height="40" rx="8" fill="url(#g)"/>
  <circle cx="20" cy="20" r="8" fill="${color}"/>
  <text x="36" y="17" fill="#e0f7fa" font-family="system-ui,sans-serif" font-size="11" font-weight="600">GAS SURFER</text>
  <text x="36" y="32" fill="#b2ebf2" font-family="system-ui,sans-serif" font-size="12">${escapeXml(name)} · ${escapeXml(label)}</text>
</svg>`;
    document.title = `${name} — ${label}`;
    document.body.innerHTML = svg;
    document.body.style.margin = '0';
  }, [chain, chainId, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm p-4">
      {loading ? 'Loading…' : 'Rendering badge…'}
    </div>
  );
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
