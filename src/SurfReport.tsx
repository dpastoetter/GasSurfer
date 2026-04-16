import { useState, useCallback } from 'react';
import type { SurfCondition, Currency, Eip1559Fees, BitcoinMempoolExtras } from './types';
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
  eip1559?: Eip1559Fees;
  bitcoinExtras?: BitcoinMempoolExtras;
  /** Extra classes on the outer wrapper (e.g. delight animation). */
  wrapperClassName?: string;
  /** Opens Learn drawer (e.g. to Standard glossary). */
  onOpenLearnStandard?: () => void;
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
  eip1559,
  bitcoinExtras,
  wrapperClassName = '',
  onOpenLearnStandard,
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
      <h2 className="font-display text-5xl md:text-7xl tracking-widest text-slate-900 dark:text-white mb-2">
        {label}
      </h2>
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
      {onOpenLearnStandard && (
        <p className="mt-2">
          <button
            type="button"
            onClick={onOpenLearnStandard}
            className="text-xs font-medium text-surf-600 dark:text-surf-300 underline underline-offset-2 hover:text-slate-900 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50 rounded"
          >
            {t('standardLearnLink')}
          </button>
        </p>
      )}
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
      {eip1559 && chainId !== 0 && (
        <p className="text-surf-600 dark:text-surf-400/90 text-xs mt-2 max-w-md mx-auto leading-relaxed">
          {ti('eip1559Line', { base: formatGwei(eip1559.baseFeeGwei), tip: formatGwei(eip1559.priorityFeeGwei) })}
        </p>
      )}
      {bitcoinExtras && chainId === 0 && (
        <div className="text-surf-600 dark:text-surf-400/90 text-xs mt-2 space-y-0.5 max-w-md mx-auto">
          {bitcoinExtras.economyFee != null && (
            <p>{ti('btcEconomyLine', { fee: formatGwei(bitcoinExtras.economyFee) })}</p>
          )}
          {bitcoinExtras.minimumFee != null && (
            <p>{ti('btcMinimumLine', { fee: formatGwei(bitcoinExtras.minimumFee) })}</p>
          )}
          {bitcoinExtras.fastestFee != null && (
            <p>{ti('btcFastestLine', { fee: formatGwei(bitcoinExtras.fastestFee) })}</p>
          )}
          <p className="pt-1">
            <a
              href="https://mempool.space?utm_source=gassurfer"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-slate-900 dark:hover:text-white"
            >
              {t('btcMempoolOpen')}
            </a>
          </p>
        </div>
      )}
      {feeAverages && (
        <div className="mt-6 max-w-md mx-auto">
          <FeeAveragesDisplay averages={feeAverages} unitLabel={feeUnitLabel(chainId)} showExplainerWhenEmpty />
        </div>
      )}
    </div>
  );
}
