import { lazy, Suspense, useState, useMemo, useEffect, useCallback } from 'react';
import { useGasPrices, getCoinGeckoId } from './useGasPrices';
import { useTokenPrices, getPriceInCurrency } from './useTokenPrices';
import { useFeeAverages } from './useFeeAverages';
import { useMergedChartHistory } from './useMergedChartHistory';
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
import { TxEstimatorPanel } from './components/TxEstimatorPanel';
import { ShareSnapshotButton } from './components/ShareSnapshotButton';
import { ChainDetailDrawer } from './components/ChainDetailDrawer';
import { RefreshIntervalControl } from './components/RefreshIntervalControl';
import { SurfBandsPanel } from './components/SurfBandsPanel';
import { useUrlSync, readUrlParams } from './hooks/useUrlSync';
import { useFavorites } from './hooks/useFavorites';
import { useMultiChainSparkHistory } from './hooks/useMultiChainSparkHistory';
import { useOnboarding } from './hooks/useOnboarding';
import { useDelightSurfsUp } from './hooks/useDelightSurfsUp';
import { useGasRefreshInterval } from './hooks/useGasRefreshInterval';
import { useServerTickReporter } from './hooks/useServerTickReporter';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useI18n } from './i18n/I18nContext';
import { appendFeeTick } from './lib/feeSamplesDb';
import { buildChainsSnapshotPayload } from './lib/snapshotJson';
import { loadGasSnapshotCache, saveGasSnapshotCache, snapshotRowsToChainGas } from './lib/gasSnapshotCache';
import type { Currency, SurfCondition } from './types';
import { feeUnitLabel, isFeaturedChain, gasCostInToken } from './types';

const OnboardingTour = lazy(() =>
  import('./components/OnboardingTour').then((m) => ({ default: m.OnboardingTour }))
);
const LearnDrawer = lazy(() => import('./components/LearnDrawer').then((m) => ({ default: m.LearnDrawer })));
const ComparePanel = lazy(() => import('./components/ComparePanel').then((m) => ({ default: m.ComparePanel })));
const WeeklyRecapModal = lazy(() =>
  import('./components/WeeklyRecapModal').then((m) => ({ default: m.WeeklyRecapModal }))
);

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
  const { refreshIntervalMs, setRefreshIntervalMs } = useGasRefreshInterval();
  const { chains: liveChains, loading, errorKey, stale, refetch } = useGasPrices(refreshIntervalMs);
  const online = useOnlineStatus();
  const { prices } = useTokenPrices(60_000);
  const feeAverages = useFeeAverages(liveChains);
  const [selectedChainId, setSelectedChainId] = useState<number>(() => urlSnap.chainId ?? 1);
  const [currency, setCurrency] = useState<Currency>(() => urlSnap.currency ?? 'usd');
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [evmSearch, setEvmSearch] = useState('');
  const [evmSort, setEvmSort] = useState<EvmSort>('fee');
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();
  const displayChains = useMemo(() => {
    if (!online) {
      const snap = loadGasSnapshotCache();
      if (snap?.chains?.length) return snapshotRowsToChainGas(snap.chains);
    }
    return liveChains;
  }, [online, liveChains]);

  const sparkHistory = useMultiChainSparkHistory(displayChains);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [detailChainId, setDetailChainId] = useState<number | null>(null);
  const [jsonCopied, setJsonCopied] = useState(false);
  const { onboardingOpen, dismissOnboarding, reopenOnboarding, tourKey } = useOnboarding();

  const onCopyJsonSnapshot = useCallback(async () => {
    if (displayChains.length === 0) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(buildChainsSnapshotPayload(displayChains, stale && online), null, 2)
      );
      setJsonCopied(true);
      window.setTimeout(() => setJsonCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [displayChains, stale, online]);

  const effectiveChainId = useMemo(() => {
    if (displayChains.length === 0) return selectedChainId;
    return displayChains.some((c) => c.chainId === selectedChainId) ? selectedChainId : displayChains[0].chainId;
  }, [displayChains, selectedChainId]);

  useUrlSync(effectiveChainId, currency, locale);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const primary = displayChains.find((c) => c.chainId === effectiveChainId) ?? displayChains[0];
  const { values: chartValues, hasServerBlend } = useMergedChartHistory(primary, CHART_HISTORY_SIZE);
  const delightBurst = useDelightSurfsUp(primary, primary ? isFavorite(primary.chainId) : false);

  const bitcoin = displayChains.find((c) => c.chainId === 0);
  const ethereum = displayChains.find((c) => c.chainId === 1);
  const evmChains = displayChains.filter((c) => !isFeaturedChain(c.chainId));

  const filteredEvmChains = useMemo(() => {
    const q = evmSearch.trim().toLowerCase();
    const list = q ? evmChains.filter((c) => c.name.toLowerCase().includes(q)) : evmChains;
    const sorted = [...list];
    if (evmSort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (evmSort === 'fee') sorted.sort((a, b) => a.gas.standard - b.gas.standard);
    else sorted.sort((a, b) => CONDITION_RANK[a.condition] - CONDITION_RANK[b.condition]);
    return sorted;
  }, [evmChains, evmSearch, evmSort]);

  const orderedEvmChains = useMemo(() => {
    const favSet = new Set(favoriteIds);
    const favOrdered = favoriteIds.map((id) => filteredEvmChains.find((c) => c.chainId === id)).filter((c): c is NonNullable<typeof c> => c != null);
    const rest = filteredEvmChains.filter((c) => !favSet.has(c.chainId));
    return [...favOrdered, ...rest];
  }, [filteredEvmChains, favoriteIds]);

  const cheapestChain = useMemo(() => {
    let best: { chain: (typeof displayChains)[0]; costFiat: number } | null = null;
    for (const chain of displayChains) {
      const costToken = gasCostInToken(chain.chainId, chain.gas.standard);
      const price = getPriceInCurrency(prices, getCoinGeckoId(chain.chainId), currency);
      if (price == null || price <= 0) continue;
      const costFiat = costToken * price;
      if (best == null || costFiat < best.costFiat) best = { chain, costFiat };
    }
    return best?.chain ?? null;
  }, [displayChains, prices, currency]);

  const latestUpdate = displayChains.length > 0 ? Math.max(...displayChains.map((c) => c.updatedAt)) : 0;

  const chainsFingerprint = useMemo(
    () => liveChains.map((c) => `${c.chainId}:${c.gas.standard}:${c.updatedAt}`).join('|'),
    [liveChains]
  );

  const serverTickFingerprint = useMemo(() => `${chainsFingerprint}|${stale}`, [chainsFingerprint, stale]);
  useServerTickReporter(liveChains, stale, serverTickFingerprint);

  useEffect(() => {
    if (liveChains.length === 0 || stale) return;
    saveGasSnapshotCache(buildChainsSnapshotPayload(liveChains, false));
  }, [chainsFingerprint, stale, liveChains]);

  useEffect(() => {
    if (liveChains.length === 0) return;
    void appendFeeTick(liveChains, stale);
  }, [chainsFingerprint, stale, liveChains]);

  const toggleCompare = (chainId: number) => {
    setCompareIds((prev) => {
      if (prev.includes(chainId)) return prev.filter((id) => id !== chainId);
      if (prev.length >= 3) return prev;
      return [...prev, chainId];
    });
  };

  const bestDealLine =
    !loading && cheapestChain && displayChains.length > 1 ? (
      <p className="mt-3 text-surf-700 dark:text-foam/90 text-sm font-medium">
        🏄 {t('bestDeal')}: <span className="text-slate-900 dark:text-white">{cheapestChain.name}</span>
        {' · '}
        <span className="text-surf-600 dark:text-surf-200 font-mono">{feeUnitLabel(cheapestChain.chainId)}</span>
      </p>
    ) : null;

  const detailChain =
    detailChainId != null ? (displayChains.find((c) => c.chainId === detailChainId) ?? null) : null;

  const cachedForOfflineBanner = loadGasSnapshotCache();
  const offlineUsingCache = !online && cachedForOfflineBanner != null && displayChains.length > 0;

  return (
    <div className="min-h-screen wave-bg text-slate-800 dark:text-white font-sans transition-colors duration-300">
      <Suspense fallback={null}>
        <OnboardingTour key={tourKey} open={onboardingOpen} onDismiss={dismissOnboarding} />
        <LearnDrawer open={learnOpen} onClose={() => setLearnOpen(false)} />
        <ComparePanel
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          chains={displayChains}
          compareIds={compareIds}
          prices={prices}
          currency={currency}
        />
        <WeeklyRecapModal open={weeklyOpen} onClose={() => setWeeklyOpen(false)} />
      </Suspense>
      <ChainDetailDrawer
        chain={detailChain}
        open={detailChain != null}
        onClose={() => setDetailChainId(null)}
      />

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

      <main
        id="main-content"
        className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
      >
        <header className="text-center mb-10 md:mb-14">
          <h1 className="font-display text-6xl md:text-8xl tracking-[0.2em] text-slate-800 dark:text-white drop-shadow-lg mb-2">
            {t('appTitle')}
          </h1>
          <p className="text-surf-600 dark:text-surf-300 text-lg md:text-xl tracking-widest uppercase">{t('tagline')}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <ThemeToggle theme={theme} onToggle={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))} />
            <LocaleSelector />
            <CurrencySelector value={currency} onChange={setCurrency} />
            <RefreshIntervalControl value={refreshIntervalMs} onChange={setRefreshIntervalMs} />
            <button
              type="button"
              onClick={() => setLearnOpen(true)}
              className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
            >
              {t('learnOpen')}
            </button>
            <button
              type="button"
              onClick={reopenOnboarding}
              className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
            >
              {t('helpTour')}
            </button>
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
            >
              {ti('compareOpen', { n: compareIds.length })}
            </button>
            <button
              type="button"
              onClick={() => setWeeklyOpen(true)}
              className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
            >
              {t('weeklyOpen')}
            </button>
            {!loading && displayChains.length > 0 && (
              <ShareSnapshotButton chain={primary} coinGeckoId={getCoinGeckoId(primary?.chainId ?? 1)} prices={prices} currency={currency} />
            )}
            {!loading && displayChains.length > 0 && (
              <button
                type="button"
                onClick={() => void onCopyJsonSnapshot()}
                className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
              >
                {jsonCopied ? `✓ ${t('copyJsonDone')}` : t('copyJson')}
              </button>
            )}
            {!loading && displayChains.length > 0 && (
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

        {offlineUsingCache && cachedForOfflineBanner && (
          <div
            className="mb-4 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-center text-sm text-sky-950 dark:text-sky-100/90"
            role="status"
            aria-live="polite"
          >
            <p>
              {ti('offlineBanner', {
                time: new Date(cachedForOfflineBanner.generatedAt).toLocaleString(
                  locale === 'de' ? 'de' : locale === 'es' ? 'es' : 'en'
                ),
              })}
            </p>
            <p className="text-xs mt-1 opacity-90">{t('offlineCachedNote')}</p>
          </div>
        )}
        {stale && online && displayChains.length > 0 && (
          <div
            className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-900 dark:text-amber-100/90"
            role="status"
            aria-live="polite"
          >
            <p>{t('staleData')}</p>
            <p className="text-xs mt-1.5 opacity-90 max-w-xl mx-auto leading-relaxed">{t('staleDataSub')}</p>
          </div>
        )}

        {loading && liveChains.length === 0 ? (
          <div className="animate-in fade-in duration-300" aria-busy="true" aria-live="polite">
            <p className="text-surf-600 dark:text-surf-400/80 text-sm text-center mb-6">{t('loadingGas')}</p>
            <PageSkeletons />
          </div>
        ) : errorKey && liveChains.length === 0 ? (
          <div className="text-center py-24" role="alert" aria-live="assertive">
            <p className="text-red-600 dark:text-red-300 mb-4">
              {errorKey === 'errorRefreshGas' ? t('errorRefreshGas') : t('errorLoadGas')}
            </p>
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
            <TxEstimatorPanel
              chain={primary}
              coinGeckoId={getCoinGeckoId(primary?.chainId ?? 1)}
              prices={prices}
              currency={currency}
            />
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
                    eip1559={primary.eip1559}
                    bitcoinExtras={primary.bitcoinExtras}
                    wrapperClassName={delightBurst ? 'surfs-up-burst' : ''}
                    onOpenLearnStandard={() => setLearnOpen(true)}
                  />
                )}
              </div>
            </section>

            <section className="mb-10">
              <NetworkSummaryStrip chains={displayChains} prices={prices} currency={currency} />
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
                  sparkHistory={sparkHistory}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  compareIds={compareIds}
                  onToggleCompare={toggleCompare}
                  onOpenDetail={setDetailChainId}
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
                  sparkHistory={sparkHistory}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  compareIds={compareIds}
                  onToggleCompare={toggleCompare}
                  onOpenDetail={setDetailChainId}
                />
              </div>
              <h2 className="font-display text-2xl tracking-wider text-surf-700 dark:text-surf-200 mb-4">{t('evmChains')}</h2>
              <EvmChainToolbar search={evmSearch} onSearchChange={setEvmSearch} sort={evmSort} onSortChange={setEvmSort} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orderedEvmChains.map((chain) => (
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
                    sparkValues={sparkHistory[chain.chainId]}
                    isFavorite={isFavorite(chain.chainId)}
                    onToggleFavorite={() => toggleFavorite(chain.chainId)}
                    compareSelected={compareIds.includes(chain.chainId)}
                    compareDisabled={compareIds.length >= 3}
                    onToggleCompare={() => toggleCompare(chain.chainId)}
                    onOpenDetail={() => setDetailChainId(chain.chainId)}
                  />
                ))}
              </div>
            </section>

            {primary && chartValues.length >= 2 && (
              <section className="mb-10" aria-labelledby="trend-heading">
                <h2 id="trend-heading" className="font-display text-2xl tracking-wider text-surf-700 dark:text-surf-200 mb-4">
                  {t('recentTrend')} · {primary.name}
                </h2>
                <div className="flex flex-col items-center gap-2">
                  <MiniChart
                    values={chartValues}
                    label={ti('chartTrendLabel', { unit: feeUnitLabel(primary.chainId), n: chartValues.length })}
                    referenceValue={feeAverages[primary.chainId]?.avg7d}
                  />
                  {hasServerBlend && (
                    <p className="text-xs text-center text-slate-500 dark:text-white/45 max-w-md">{t('chartBlendsServer')}</p>
                  )}
                </div>
              </section>
            )}

            <SurfBandsPanel chains={displayChains} onBandsSaved={() => void refetch()} />
            <footer className="text-center text-slate-500 dark:text-white/40 text-sm space-y-2">
              <p>{t('footerNote')}</p>
              <p className="text-xs max-w-lg mx-auto leading-relaxed">{t('footerBridgeNote')}</p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
