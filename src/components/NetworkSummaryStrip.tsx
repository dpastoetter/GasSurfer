import { useMemo } from 'react';
import type { ChainGas, Currency } from '../types';
import { formatGwei, gasCostInToken, formatFiat, isFeaturedChain } from '../types';
import { getCoinGeckoId } from '../useGasPrices';
import { getPriceInCurrency } from '../useTokenPrices';
import { useI18n } from '../i18n/I18nContext';

interface NetworkSummaryStripProps {
  chains: ChainGas[];
  prices: Record<string, Partial<Record<Currency, number>>>;
  currency: Currency;
}

export function NetworkSummaryStrip({ chains, prices, currency }: NetworkSummaryStripProps) {
  const { t } = useI18n();

  const evmOnly = useMemo(() => chains.filter((c) => !isFeaturedChain(c.chainId)), [chains]);

  const stats = useMemo(() => {
    if (evmOnly.length === 0) return null;
    const withFiat = evmOnly.map((chain) => {
      const costToken = gasCostInToken(chain.chainId, chain.gas.standard);
      const price = getPriceInCurrency(prices, getCoinGeckoId(chain.chainId), currency);
      const fiat = price != null && price > 0 ? costToken * price : null;
      return { chain, fiat, standard: chain.gas.standard };
    });
    const sortedByFiat = [...withFiat].filter((x) => x.fiat != null).sort((a, b) => (a.fiat ?? 0) - (b.fiat ?? 0));
    const sortedByStd = [...withFiat].sort((a, b) => a.standard - b.standard);
    const cheapest = sortedByFiat[0] ?? sortedByStd[0];
    const highestFiat = [...withFiat].filter((x) => x.fiat != null).sort((a, b) => (b.fiat ?? 0) - (a.fiat ?? 0));
    const highest = highestFiat[0] ?? sortedByStd[sortedByStd.length - 1];
    const mids = sortedByStd.map((x) => x.standard).sort((a, b) => a - b);
    const mid = mids[Math.floor(mids.length / 2)];
    const midChain = sortedByStd.find((x) => x.standard === mid)?.chain;
    return { cheapest, highest, median: mid, midChain };
  }, [evmOnly, prices, currency]);

  if (!stats) return null;

  const fmt = (chain: ChainGas, fiat: number | null) => {
    const unit = chain.chainId === 0 ? 'sat/vB' : 'gwei';
    if (fiat != null) return `${formatGwei(chain.gas.standard)} ${unit} · ${formatFiat(fiat, currency)}`;
    return `${formatGwei(chain.gas.standard)} ${unit}`;
  };

  return (
    <div
      className="mb-6 rounded-2xl glass border border-slate-200/50 dark:border-white/10 px-4 py-3 text-sm"
      role="region"
      aria-label={t('summaryRegion')}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
        <div>
          <p className="text-slate-500 dark:text-white/50 text-xs uppercase tracking-wide mb-0.5">{t('summaryCheapest')}</p>
          <p className="text-slate-900 dark:text-white font-medium">{stats.cheapest.chain.name}</p>
          <p className="text-surf-600 dark:text-surf-300 font-mono text-xs">{fmt(stats.cheapest.chain, stats.cheapest.fiat)}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-white/50 text-xs uppercase tracking-wide mb-0.5">{t('summaryHighest')}</p>
          <p className="text-slate-900 dark:text-white font-medium">{stats.highest.chain.name}</p>
          <p className="text-surf-600 dark:text-surf-300 font-mono text-xs">{fmt(stats.highest.chain, stats.highest.fiat)}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-white/50 text-xs uppercase tracking-wide mb-0.5">{t('summaryMedian')}</p>
          <p className="text-slate-900 dark:text-white font-medium">{stats.midChain?.name ?? '—'}</p>
          <p className="text-surf-600 dark:text-surf-300 font-mono text-xs">
            {formatGwei(stats.median)} gwei
          </p>
        </div>
      </div>
      <p className="text-slate-400 dark:text-white/35 text-[10px] mt-2 text-center sm:text-left">{t('summaryFiatNote')}</p>
    </div>
  );
}
