import type { ChainGas, SurfCondition, Currency } from './types';
import { formatGwei, gasCostInToken, formatFiat, feeUnitLabel, costLabel, BITCOIN_CHAIN_ID } from './types';
import { getPriceInCurrency } from './useTokenPrices';
import { FeeAveragesDisplay } from './FeeAveragesDisplay';
import type { FeeAverages } from './feeHistory';
import { useI18n } from './i18n/I18nContext';
import { conditionLabels } from './i18n/messages';

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

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isPrimary}
      className={`
        w-full text-left rounded-2xl glass border bg-gradient-to-br ${gradient}
        transition-all duration-300 hover:scale-[1.02] hover:border-slate-300/50 dark:hover:border-white/20
        focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-deep-950
        ${featured ? 'p-6 md:p-7 border-2 border-slate-300/50 dark:border-white/20 shadow-lg shadow-surf-900/30' : 'p-5'}
        ${isPrimary ? 'ring-2 ring-surf-400/50 ring-offset-2 ring-offset-white dark:ring-offset-deep-950' : ''}
      `}
    >
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
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
      {chain.chainId === BITCOIN_CHAIN_ID && (
        <p className="text-slate-400 dark:text-white/30 text-[10px] mt-0.5">{t('btcBlockHint')}</p>
      )}
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
    </button>
  );
}
