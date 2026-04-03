import { useState, useMemo, useEffect } from 'react';
import { useGasPrices, getCoinGeckoId } from './useGasPrices';
import { useTokenPrices, getPriceInCurrency } from './useTokenPrices';
import { useFeeAverages } from './useFeeAverages';
import { useChartHistory } from './useChartHistory';
import { SurfReport } from './SurfReport';
import { ChainCard } from './ChainCard';
import { FeaturedChainWidget } from './FeaturedChainWidget';
import { MiniChart } from './MiniChart';
import { CurrencySelector } from './CurrencySelector';
import { LastUpdated } from './LastUpdated';
import { PageSkeletons } from './Skeletons';
import { ThemeToggle, type Theme } from './ThemeToggle';
import { EvmChainToolbar, type EvmSort } from './components/EvmChainToolbar';
import { NetworkSummaryStrip } from './components/NetworkSummaryStrip';
import { FeeAlertsPanel } from './components/FeeAlertsPanel';
import { LocaleSelector } from './components/LocaleSelector';
import { useUrlSync, readUrlParams } from './hooks/useUrlSync';
import { useI18n } from './i18n/I18nContext';
import type { Currency, SurfCondition } from './types';
import { feeUnitLabel, isFeaturedChain, gasCostInToken } from './types';

const CHART_HISTORY_SIZE = 24;
const THEME_STORAGE_KEY = 'gas-surfer-theme';

const CONDITION_RANK: Record<SurfCondition, number> = {
  'surfs-up': 0,
  smooth: 1,
  choppy: 2,
  storm: 3,
};

function loadTheme(): Theme {
  try {
    const s = localStorage.getItem(THEME_STORAGE_KEY);
    if (s === 'light' || s === 'dark') return s;
  } catch {
    /* ignore */
  }
  return 'dark';
}

function App() {
  const { t, ti, locale } = useI18n();
  const [urlSnap] = useState(() => readUrlParams());
  const { chains, loading, error, stale, refetch } = useGasPrices(12_000);
  const { prices } = useTokenPrices(60_000);
  const feeAverages = useFeeAverages(chains);
  const [selectedChainId, setSelectedChainId] = useState<number>(() => urlSnap.chainId ?? 1);
  const [currency, setCurrency] = useState<Currency>(() => urlSnap.currency ?? 'usd');
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [evmSearch, setEvmSearch] = useState('');
  const [evmSort, setEvmSort] = useState<EvmSort>('fee');

  const effectiveChainId = useMemo(() => {
    if (chains.length === 0) return selectedChainId;
    return chains.some((c) => c.chainId === selectedChainId) ? selectedChainId : chains[0].chainId;
  }, [chains, selectedChainId]);

  useUrlSync(effectiveChainId, currency, locale);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const primary = chains.find((c) => c.chainId === effectiveChainId) ?? chains[0];
  const chartValues = useChartHistory(primary, CHART_HISTORY_SIZE);

  const bitcoin = chains.find((c) => c.chainId === 0);
  const ethereum = chains.find((c) => c.chainId === 1);
  const evmChains = chains.filter((c) => !isFeaturedChain(c.chainId));

  const filteredEvmChains = useMemo(() => {
    const q = evmSearch.trim().toLowerCase();
    const list = q ? evmChains.filter((c) => c.name.toLowerCase().includes(q)) : evmChains;
    const sorted = [...list];
    if (evmSort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (evmSort === 'fee') sorted.sort((a, b) => a.gas.standard - b.gas.standard);
    else sorted.sort((a, b) => CONDITION_RANK[a.condition] - CONDITION_RANK[b.condition]);
    return sorted;
  }, [evmChains, evmSearch, evmSort]);

  const cheapestChain = useMemo(() => {
    let best: { chain: (typeof chains)[0]; costFiat: number } | null = null;
    for (const chain of chains) {
      const costToken = gasCostInToken(chain.chainId, chain.gas.standard);
      const price = getPriceInCurrency(prices, getCoinGeckoId(chain.chainId), currency);
      if (price == null || price <= 0) continue;
      const costFiat = costToken * price;
      if (best == null || costFiat < best.costFiat) best = { chain, costFiat };
    }
    return best?.chain ?? null;
  }, [chains, prices, currency]);

  const latestUpdate = chains.length > 0 ? Math.max(...chains.map((c) => c.updatedAt)) : 0;

  const bestDealLine =
    !loading && cheapestChain && chains.length > 1 ? (
      <p className="mt-3 text-surf-700 dark:text-foam/90 text-sm font-medium">
        🏄 {t('bestDeal')}: <span className="text-slate-900 dark:text-white">{cheapestChain.name}</span>
        {' · '}
        <span className="text-surf-600 dark:text-surf-200 font-mono">{feeUnitLabel(cheapestChain.chainId)}</span>
      </p>
    ) : null;

  return (
    <div className="min-h-screen wave-bg text-slate-800 dark:text-white font-sans transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-48 wave-overlay" />
        <div
          className="absolute bottom-0 left-0 w-[200%] h-32 wave-orb rounded-[50%] animate-wave"
          style={{ animation: 'wave 8s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-2 left-0 w-[180%] h-24 wave-orb-slow rounded-[50%]"
          style={{ animation: 'wave-slow 12s ease-in-out infinite' }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10 md:mb-14">
          <h1 className="font-display text-6xl md:text-8xl tracking-[0.2em] text-slate-800 dark:text-white drop-shadow-lg mb-2">
            {t('appTitle')}
          </h1>
          <p className="text-surf-600 dark:text-surf-300 text-lg md:text-xl tracking-widest uppercase">{t('tagline')}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <ThemeToggle theme={theme} onToggle={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))} />
            <LocaleSelector />
            <CurrencySelector value={currency} onChange={setCurrency} />
            {!loading && chains.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={refetch}
                  className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-deep-950"
                  title={t('refreshTitle')}
                  aria-label={t('refreshTitle')}
                >
                  ↻ {t('refresh')}
                </button>
                {latestUpdate > 0 && (
                  <LastUpdated timestamp={latestUpdate} className="text-surf-600 dark:text-surf-400/90 text-sm" />
                )}
              </>
            )}
          </div>
          {bestDealLine}
        </header>

        {stale && chains.length > 0 && (
          <div
            className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-900 dark:text-amber-100/90"
            role="status"
            aria-live="polite"
          >
            {t('staleData')}
          </div>
        )}

        {loading && chains.length === 0 ? (
          <div className="animate-in fade-in duration-300" aria-busy="true" aria-live="polite">
            <p className="text-surf-600 dark:text-surf-400/80 text-sm text-center mb-6">{t('loadingGas')}</p>
            <PageSkeletons />
          </div>
        ) : error && chains.length === 0 ? (
          <div className="text-center py-24" role="alert" aria-live="assertive">
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="px-6 py-3 rounded-xl glass border border-slate-300/50 dark:border-white/20 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-deep-950"
            >
              {t('retry')}
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500" key="loaded">
            <FeeAlertsPanel chain={primary} />
            <section className="mb-12 md:mb-16">
              <div className="glass-strong rounded-3xl p-8 md:p-12 border border-slate-200/50 dark:border-white/10 shadow-2xl">
                {primary && (
                  <SurfReport
                    condition={primary.condition}
                    gwei={primary.gas.standard}
                    chainName={primary.name}
                    chainId={primary.chainId}
                    coinGeckoId={getCoinGeckoId(primary.chainId)}
                    prices={prices}
                    currency={currency}
                    feeAverages={feeAverages[primary.chainId]}
                  />
                )}
              </div>
            </section>

            <section className="mb-10">
              <NetworkSummaryStrip chains={chains} prices={prices} currency={currency} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-10">
                <FeaturedChainWidget
                  chain={bitcoin ?? null}
                  title={t('bitcoinTitle')}
                  theme="bitcoin"
                  selectedChainId={effectiveChainId}
                  onSelectChain={setSelectedChainId}
                  prices={prices}
                  currency={currency}
                  feeAverages={bitcoin ? feeAverages[bitcoin.chainId] : undefined}
                  isCheapest={cheapestChain?.chainId === bitcoin?.chainId}
                />
                <FeaturedChainWidget
                  chain={ethereum ?? null}
                  title={t('ethereumTitle')}
                  theme="ethereum"
                  selectedChainId={effectiveChainId}
                  onSelectChain={setSelectedChainId}
                  prices={prices}
                  currency={currency}
                  feeAverages={ethereum ? feeAverages[ethereum.chainId] : undefined}
                  isCheapest={cheapestChain?.chainId === ethereum?.chainId}
                />
              </div>
              <h2 className="font-display text-2xl tracking-wider text-surf-700 dark:text-surf-200 mb-4">{t('evmChains')}</h2>
              <EvmChainToolbar search={evmSearch} onSearchChange={setEvmSearch} sort={evmSort} onSortChange={setEvmSort} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvmChains.map((chain) => (
                  <ChainCard
                    key={chain.chainId}
                    chain={chain}
                    coinGeckoId={getCoinGeckoId(chain.chainId)}
                    prices={prices}
                    currency={currency}
                    feeAverages={feeAverages[chain.chainId]}
                    isPrimary={chain.chainId === effectiveChainId}
                    isCheapest={cheapestChain?.chainId === chain.chainId}
                    onClick={() => setSelectedChainId(chain.chainId)}
                  />
                ))}
              </div>
            </section>

            {primary && chartValues.length >= 2 && (
              <section className="mb-10" aria-labelledby="trend-heading">
                <h2 id="trend-heading" className="font-display text-2xl tracking-wider text-surf-700 dark:text-surf-200 mb-4">
                  {t('recentTrend')} · {primary.name}
                </h2>
                <div className="flex justify-center">
                  <MiniChart
                    values={chartValues}
                    label={ti('chartTrendLabel', { unit: feeUnitLabel(primary.chainId), n: chartValues.length })}
                    referenceValue={feeAverages[primary.chainId]?.avg7d}
                  />
                </div>
              </section>
            )}

            <footer className="text-center text-slate-500 dark:text-white/40 text-sm">
              <p>{t('footerNote')}</p>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
