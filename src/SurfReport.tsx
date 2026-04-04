import { useState, useCallback } from 'react';
import type { SurfCondition, Currency } from './types';
import { formatGwei, gasCostInToken, formatFiat, feeUnitLabel, costLabel } from './types';
import { getPriceInCurrency } from './useTokenPrices';
import { FeeAveragesDisplay } from './FeeAveragesDisplay';
import type { FeeAverages } from './feeHistory';
import { useI18n } from './i18n/I18nContext';
import { conditionLabels } from './i18n/messages';

interface SurfReportProps {
  condition: SurfCondition;
  gwei: number;
  chainName: string;
  chainId: number;
  coinGeckoId: string;
  prices: Record<string, Partial<Record<Currency, number>>>;
  currency: Currency;
  feeAverages?: FeeAverages;
  /** Extra classes on the outer wrapper (e.g. delight animation). */
  wrapperClassName?: string;
}

export function SurfReport({
  condition,
  gwei,
  chainName,
  coinGeckoId,
  prices,
  currency,
  chainId,
  feeAverages,
  wrapperClassName = '',
}: SurfReportProps) {
  const [copied, setCopied] = useState(false);
  const { t, ti, locale } = useI18n();
  const { label, sub, emoji } = conditionLabels(locale)[condition];
  const costToken = gasCostInToken(chainId, gwei);
  const price = getPriceInCurrency(prices, coinGeckoId, currency);
  const costFiat = price != null ? costToken * price : null;

  const copyFee = useCallback(() => {
    const text = `${chainName} standard: ${formatGwei(gwei)} ${feeUnitLabel(chainId)}`;
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [chainName, gwei, chainId]);

  const avg7d = feeAverages?.avg7d;
  const trendPercent =
    avg7d != null && avg7d > 0 && Number.isFinite(gwei) ? Math.round(((gwei - avg7d) / avg7d) * 100) : null;

  return (
    <div className={`text-center ${wrapperClassName}`} role="region" aria-label={t('surfReportRegion')}>
      <div
        className="inline-flex items-center justify-center w-24 h-24 rounded-full text-5xl mb-4 animate-float glass-strong"
        style={{ animationDuration: '3s' }}
        aria-hidden
      >
        {emoji}
      </div>
      <h1 className="font-display text-5xl md:text-7xl tracking-widest text-slate-900 dark:text-white mb-2">
        {label}
      </h1>
      <p className="text-surf-600 dark:text-surf-200 text-lg md:text-xl mb-1">{sub}</p>
      <p className="text-surf-600 dark:text-surf-400/90 text-sm flex flex-wrap items-center justify-center gap-2">
        <span>
          {chainName} · <span className="text-surf-700 dark:text-foam font-semibold">{formatGwei(gwei)} {feeUnitLabel(chainId)}</span>
        </span>
        <button
          type="button"
          onClick={copyFee}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium bg-slate-200/60 dark:bg-white/10 hover:bg-slate-300/60 dark:hover:bg-white/20 text-slate-700 dark:text-surf-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
          title={t('copyFee')}
          aria-label={t('copyFee')}
        >
          {copied ? `✓ ${t('copied')}` : `📋 ${t('copy')}`}
        </button>
      </p>
      {trendPercent != null && (
        <p className="text-surf-600 dark:text-surf-300/90 text-sm mt-1">
          {trendPercent <= 0 ? (
            <span className="text-emerald-600 dark:text-emerald-300/90">{ti('trendDown', { n: Math.abs(trendPercent) })}</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-300/90">{ti('trendUp', { n: trendPercent })}</span>
          )}
        </p>
      )}
      {costFiat != null && (
        <p className="text-surf-600 dark:text-surf-300 text-base mt-2">
          {costLabel(chainId)} ≈ <span className="text-surf-700 dark:text-foam font-semibold">{formatFiat(costFiat, currency)}</span>
        </p>
      )}
      {feeAverages && (
        <div className="mt-6 max-w-md mx-auto">
          <FeeAveragesDisplay averages={feeAverages} unitLabel={feeUnitLabel(chainId)} showExplainerWhenEmpty />
        </div>
      )}
    </div>
  );
}
