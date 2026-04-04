import type { ChainGas } from './types';
import type { Currency } from './types';
import type { FeeAverages } from './feeHistory';
import { ChainCard } from './ChainCard';
import { getCoinGeckoId } from './useGasPrices';
import { useI18n } from './i18n/I18nContext';

export type FeaturedTheme = 'bitcoin' | 'ethereum';

const THEME_CLASSES: Record<
  FeaturedTheme,
  { wrapper: string; heading: string }
> = {
  bitcoin: {
    wrapper:
      'rounded-2xl border-2 border-amber-500/60 dark:border-amber-400 bg-amber-100/80 dark:bg-amber-950/20 p-4 md:p-5 ring-1 ring-amber-400/50 [&_button]:border-amber-400/60',
    heading: 'font-display text-lg tracking-wider text-amber-800 dark:text-amber-200/90 mb-3',
  },
  ethereum: {
    wrapper: 'rounded-2xl border-2 border-blue-500/50 dark:border-blue-500/30 bg-blue-100/80 dark:bg-blue-950/20 p-4 md:p-5',
    heading: 'font-display text-lg tracking-wider text-blue-800 dark:text-blue-200/90 mb-3',
  },
};

interface FeaturedChainWidgetProps {
  chain: ChainGas | null;
  title: string;
  theme: FeaturedTheme;
  selectedChainId: number;
  onSelectChain: (chainId: number) => void;
  prices: Record<string, Partial<Record<Currency, number>>>;
  currency: Currency;
  feeAverages: FeeAverages | undefined;
  isCheapest?: boolean;
  sparkHistory: Record<number, number[]>;
  isFavorite: (chainId: number) => boolean;
  onToggleFavorite: (chainId: number) => void;
  compareIds: number[];
  onToggleCompare: (chainId: number) => void;
}

export function FeaturedChainWidget({
  chain,
  title,
  theme,
  selectedChainId,
  onSelectChain,
  prices,
  currency,
  feeAverages,
  isCheapest,
  sparkHistory,
  isFavorite,
  onToggleFavorite,
  compareIds,
  onToggleCompare,
}: FeaturedChainWidgetProps) {
  const { wrapper, heading } = THEME_CLASSES[theme];
  const { t } = useI18n();

  return (
    <div className={wrapper}>
      <h2 className={heading}>{title}</h2>
      {chain ? (
        <ChainCard
          chain={chain}
          coinGeckoId={getCoinGeckoId(chain.chainId)}
          prices={prices}
          currency={currency}
          feeAverages={feeAverages}
          isPrimary={chain.chainId === selectedChainId}
          isCheapest={isCheapest}
          featured
          onClick={() => onSelectChain(chain.chainId)}
          sparkValues={sparkHistory[chain.chainId]}
          isFavorite={isFavorite(chain.chainId)}
          onToggleFavorite={() => onToggleFavorite(chain.chainId)}
          compareSelected={compareIds.includes(chain.chainId)}
          compareDisabled={compareIds.length >= 3}
          onToggleCompare={() => onToggleCompare(chain.chainId)}
        />
      ) : (
        <div className="rounded-2xl glass p-8 text-center text-slate-500 dark:text-white/50" aria-live="polite">
          {t('loadingFeatured')}
        </div>
      )}
    </div>
  );
}
