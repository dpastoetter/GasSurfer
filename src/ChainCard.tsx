import type { ChainGas, SurfCondition, Currency } from './types';
import { formatGwei, gasCostInToken, formatFiat, feeUnitLabel, costLabel, BITCOIN_CHAIN_ID } from './types';
import { getPriceInCurrency } from './useTokenPrices';
import { FeeAveragesDisplay } from './FeeAveragesDisplay';
import type { FeeAverages } from './feeHistory';
import { useI18n } from './i18n/I18nContext';
import { conditionLabels } from './i18n/messages';
import { MicroSparkline } from './components/MicroSparkline';
import { DataFreshness } from './components/DataFreshness';

const CONDITION_COLORS: Record<SurfCondition, string> = {
  'surfs-up': 'from-emerald-500/30 to-surf-500/30 border-emerald-400/40',
  smooth: 'from-surf-500/30 to-cyan-500/30 border-surf-400/40',
  choppy: 'from-amber-500/20 to-orange-500/20 border-amber-400/40',
  storm: 'from-red-500/20 to-storm/30 border-red-400/40',
};

interface ChainCardProps {
  chain: ChainGas;
  coinGeckoId: string;
  prices: Record<string, Partial<Record<Currency, number>>>;
  currency: Currency;
  feeAverages?: FeeAverages;
  isPrimary?: boolean;
  isCheapest?: boolean;
  featured?: boolean;
  onClick?: () => void;
  sparkValues?: number[];
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  compareSelected?: boolean;
  compareDisabled?: boolean;
  onToggleCompare?: () => void;
  onOpenDetail?: () => void;
}

export function ChainCard({
  chain,
  coinGeckoId,
  prices,
  currency,
  feeAverages,
  isPrimary,
  isCheapest,
  featured,
  onClick,
  sparkValues,
  isFavorite,
  onToggleFavorite,
  compareSelected,
  compareDisabled,
  onToggleCompare,
  onOpenDetail,
}: ChainCardProps) {
  const { t, ti, locale } = useI18n();
  const gradient = CONDITION_COLORS[chain.condition];
  const conditionLabel = conditionLabels(locale)[chain.condition].label;
  const ariaLabel = ti('chainCardLabel', {
    name: chain.name,
    condition: conditionLabel,
    fee: formatGwei(chain.gas.standard),
    unit: feeUnitLabel(chain.chainId),
  });

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const pad = featured ? 'p-6 md:p-7 pt-12 md:pt-14' : 'p-5 pt-11';

  return (
    <div
      className={`
        relative w-full text-left rounded-2xl glass border bg-gradient-to-br ${gradient}
        transition-all duration-300 hover:scale-[1.01] hover:border-slate-300/50 dark:hover:border-white/20
        ${featured ? 'border-2 border-slate-300/50 dark:border-white/20 shadow-lg shadow-surf-900/30' : ''}
        ${isPrimary ? 'ring-2 ring-surf-400/50 ring-offset-2 ring-offset-white dark:ring-offset-deep-950' : ''}
      `}
    >
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="rounded-lg px-2 py-1 text-sm bg-white/70 dark:bg-black/30 border border-slate-300/40 dark:border-white/15 hover:bg-white dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
            aria-pressed={isFavorite}
            aria-label={isFavorite ? t('favoriteRemove') : t('favoriteAdd')}
            title={isFavorite ? t('favoriteRemove') : t('favoriteAdd')}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        )}
        {onToggleCompare && (
          <button
            type="button"
            disabled={compareDisabled && !compareSelected}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
            className="rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide bg-white/70 dark:bg-black/30 border border-slate-300/40 dark:border-white/15 hover:bg-white dark:hover:bg-white/10 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
            aria-pressed={compareSelected}
            aria-label={t('compareToggle')}
          >
            {compareSelected ? t('compareOn') : t('compareOff')}
          </button>
        )}
        {onOpenDetail && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="rounded-lg px-2 py-1 text-[10px] font-medium bg-white/70 dark:bg-black/30 border border-slate-300/40 dark:border-white/15 hover:bg-white dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
            aria-label={t('chainDetailButton')}
            title={t('chainDetailButton')}
          >
            ℹ
          </button>
        )}
      </div>

      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={`w-full text-left rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-surf-400/50 ${pad}`}
        aria-label={onClick ? ariaLabel : undefined}
        aria-pressed={onClick ? isPrimary : undefined}
      >
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap pr-1">
          <span className={`font-display tracking-wide text-slate-900 dark:text-white ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
            {chain.name}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {featured && (
              <span className="text-[10px] uppercase tracking-widest text-surf-600 dark:text-surf-400/80 font-semibold">{t('featured')}</span>
            )}
            {isCheapest && (
              <span className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400/90 font-semibold bg-emerald-500/25 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                {t('bestDealBadge')}
              </span>
            )}
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                chain.condition === 'surfs-up'
                  ? 'bg-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                  : chain.condition === 'storm'
                    ? 'bg-red-500/30 text-red-800 dark:text-red-200'
                    : 'bg-slate-300/50 dark:bg-white/10 text-slate-700 dark:text-surf-200'
              }`}
            >
              {conditionLabel}
            </span>
          </div>
        </div>
        {sparkValues && sparkValues.length >= 2 && (
          <div className="flex justify-end mb-2 -mt-1">
            <MicroSparkline values={sparkValues} aria-label={t('sparkAria')} />
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-slate-500 dark:text-white/50">{t('slow')}</p>
            <p className="text-surf-700 dark:text-foam font-mono font-semibold">{formatGwei(chain.gas.slow)}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-white/50">{t('standard')}</p>
            <p className="text-slate-900 dark:text-white font-mono font-semibold">{formatGwei(chain.gas.standard)}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-white/50">{t('fast')}</p>
            <p className="text-surf-600 dark:text-surf-300 font-mono font-semibold">{formatGwei(chain.gas.fast)}</p>
          </div>
        </div>
        <p className="text-slate-500 dark:text-white/40 text-xs mt-2">{feeUnitLabel(chain.chainId)}</p>
        {chain.eip1559 && chain.chainId !== BITCOIN_CHAIN_ID && (
          <p className="text-slate-500 dark:text-white/40 text-[10px] mt-0.5 leading-snug">
            {ti('eip1559Line', {
              base: formatGwei(chain.eip1559.baseFeeGwei),
              tip: formatGwei(chain.eip1559.priorityFeeGwei),
            })}
          </p>
        )}
        {chain.bitcoinExtras && chain.chainId === BITCOIN_CHAIN_ID && (
          <div className="text-slate-500 dark:text-white/40 text-[10px] mt-0.5 space-y-0.5">
            {chain.bitcoinExtras.economyFee != null && (
              <p>{ti('btcEconomyLine', { fee: formatGwei(chain.bitcoinExtras.economyFee) })}</p>
            )}
            {chain.bitcoinExtras.fastestFee != null && (
              <p>{ti('btcFastestLine', { fee: formatGwei(chain.bitcoinExtras.fastestFee) })}</p>
            )}
          </div>
        )}
        {chain.chainId === BITCOIN_CHAIN_ID && (
          <p className="text-slate-400 dark:text-white/30 text-[10px] mt-0.5">{t('btcBlockHint')}</p>
        )}
        <DataFreshness key={`${chain.chainId}-${chain.updatedAt}`} updatedAt={chain.updatedAt} dataSource={chain.dataSource} className="mt-1" />
        {(() => {
          const costToken = gasCostInToken(chain.chainId, chain.gas.standard);
          const price = getPriceInCurrency(prices, coinGeckoId, currency);
          const costFiat = price != null ? costToken * price : null;
          return costFiat != null ? (
            <p className="text-surf-600 dark:text-surf-300 text-sm mt-2">
              {costLabel(chain.chainId)} ≈ {formatFiat(costFiat, currency)}
            </p>
          ) : null;
        })()}
        {feeAverages && (
          <FeeAveragesDisplay averages={feeAverages} unitLabel={feeUnitLabel(chain.chainId)} compact />
        )}
      </div>
    </div>
  );
}
