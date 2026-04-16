import { useState, useMemo } from 'react';
import type { ChainGas } from '../types';
import { BITCOIN_CHAIN_ID } from '../types';
import { feeUnitLabel } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { conditionLabels } from '../i18n/messages';
import { loadSurfBandOverrides, setSurfBandOverride, clearAllSurfBandOverrides, type SurfBandOverride } from '../lib/surfBandsStorage';
import { getSurfCondition } from '../lib/surfCondition';

interface SurfBandsPanelProps {
  chains: ChainGas[];
  onBandsSaved: () => void;
}

function readBandFields(chainId: number): { low: string; mid: string; high: string } {
  const o = loadSurfBandOverrides()[chainId];
  return {
    low: o != null ? String(o.low) : '',
    mid: o != null ? String(o.mid) : '',
    high: o != null ? String(o.high) : '',
  };
}

/** Remount via `key={resolvedId}` so fields reload from storage when the selected chain changes. */
function SurfBandsForm({
  resolvedId,
  sorted,
  onBandsSaved,
  onChainChange,
}: {
  resolvedId: number;
  sorted: ChainGas[];
  onBandsSaved: () => void;
  onChainChange: (id: number) => void;
}) {
  const { t, locale } = useI18n();
  const initial = readBandFields(resolvedId);
  const [low, setLow] = useState(initial.low);
  const [mid, setMid] = useState(initial.mid);
  const [high, setHigh] = useState(initial.high);

  const preview = useMemo(() => {
    const L = parseFloat(low);
    const M = parseFloat(mid);
    const H = parseFloat(high);
    if (![L, M, H].every((n) => Number.isFinite(n) && n > 0) || L > M || M > H) return null;
    const band: SurfBandOverride = { low: L, mid: M, high: H };
    const std = sorted.find((c) => c.chainId === resolvedId)?.gas.standard ?? L;
    return getSurfCondition(std, resolvedId, band);
  }, [low, mid, high, resolvedId, sorted]);

  const save = () => {
    const L = parseFloat(low);
    const M = parseFloat(mid);
    const H = parseFloat(high);
    if (![L, M, H].every((n) => Number.isFinite(n) && n > 0) || L > M || M > H) return;
    setSurfBandOverride(resolvedId, { low: L, mid: M, high: H });
    onBandsSaved();
  };

  const resetChain = () => {
    setSurfBandOverride(resolvedId, null);
    const next = readBandFields(resolvedId);
    setLow(next.low);
    setMid(next.mid);
    setHigh(next.high);
    onBandsSaved();
  };

  const resetAll = () => {
    clearAllSurfBandOverrides();
    const next = readBandFields(resolvedId);
    setLow(next.low);
    setMid(next.mid);
    setHigh(next.high);
    onBandsSaved();
  };

  return (
    <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-surf-200">
      <p className="text-xs text-slate-600 dark:text-surf-300/90 leading-relaxed">{t('surfBandsHint')}</p>
      <label className="block">
        <span className="text-xs font-medium text-slate-500 dark:text-white/50">{t('surfBandsChain')}</span>
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-deep-900 px-2 py-2 text-sm"
          value={resolvedId}
          onChange={(e) => onChainChange(Number(e.target.value))}
        >
          {sorted.map((c) => (
            <option key={c.chainId} value={c.chainId}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-500 dark:text-white/50">{t('surfBandsLow')}</span>
          <input
            type="text"
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-deep-900 px-2 py-1.5 font-mono text-xs"
            value={low}
            onChange={(e) => setLow(e.target.value)}
            placeholder={t('surfBandsPlaceholder')}
            aria-label={t('surfBandsLow')}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500 dark:text-white/50">{t('surfBandsMid')}</span>
          <input
            type="text"
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-deep-900 px-2 py-1.5 font-mono text-xs"
            value={mid}
            onChange={(e) => setMid(e.target.value)}
            placeholder={t('surfBandsPlaceholder')}
            aria-label={t('surfBandsMid')}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500 dark:text-white/50">{t('surfBandsHigh')}</span>
          <input
            type="text"
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-deep-900 px-2 py-1.5 font-mono text-xs"
            value={high}
            onChange={(e) => setHigh(e.target.value)}
            placeholder={t('surfBandsPlaceholder')}
            aria-label={t('surfBandsHigh')}
          />
        </label>
      </div>
      <p className="text-xs text-slate-500 dark:text-white/45">
        {feeUnitLabel(resolvedId)} · {t('surfBandsPreview')}:{' '}
        {preview != null ? conditionLabels(locale)[preview].label : '—'}
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={save}
          className="rounded-lg bg-surf-600 text-white px-3 py-1.5 text-xs font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
        >
          {t('surfBandsSave')}
        </button>
        <button
          type="button"
          onClick={resetChain}
          className="rounded-lg border border-slate-300 dark:border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-slate-200/50 dark:hover:bg-white/10"
        >
          {t('surfBandsResetChain')}
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="rounded-lg border border-slate-300 dark:border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-slate-200/50 dark:hover:bg-white/10"
        >
          {t('surfBandsResetAll')}
        </button>
      </div>
    </div>
  );
}

export function SurfBandsPanel({ chains, onBandsSaved }: SurfBandsPanelProps) {
  const { t } = useI18n();
  const sorted = useMemo(
    () => [...chains].sort((a, b) => a.name.localeCompare(b.name)),
    [chains]
  );
  const [pickerId, setPickerId] = useState(BITCOIN_CHAIN_ID);
  const [open, setOpen] = useState(false);

  const resolvedId = useMemo(() => {
    if (sorted.length === 0) return pickerId;
    return sorted.some((c) => c.chainId === pickerId) ? pickerId : sorted[0]!.chainId;
  }, [sorted, pickerId]);

  if (sorted.length === 0) return null;

  return (
    <section className="mb-8 text-left max-w-xl mx-auto rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/80 dark:bg-black/25 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-sm font-semibold text-slate-800 dark:text-surf-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50 rounded-lg"
        aria-expanded={open}
      >
        <span>{t('surfBandsAdvancedToggle')}</span>
        <span className="text-slate-500 dark:text-white/50" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && (
        <SurfBandsForm
          key={resolvedId}
          resolvedId={resolvedId}
          sorted={sorted}
          onBandsSaved={onBandsSaved}
          onChainChange={setPickerId}
        />
      )}
    </section>
  );
}
