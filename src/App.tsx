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
import type { Currency } from './types';
import { feeUnitLabel, isFeaturedChain, gasCostInToken } from './types';

const CHART_HISTORY_SIZE = 24;
const THEME_STORAGE_KEY = 'gas-surfer-theme';

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
  const { chains, loading, error, refetch } = useGasPrices(12_000);
  const { prices } = useTokenPrices(60_000);
  const feeAverages = useFeeAverages(chains);
  const [selectedChainId, setSelectedChainId] = useState<number>(1);
  const [currency, setCurrency] = useState<Currency>('usd');
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const primary = chains.find((c) => c.chainId === selectedChainId) ?? chains[0];
  const chartValues = useChartHistory(primary, CHART_HISTORY_SIZE);

  const bitcoin = chains.find((c) => c.chainId === 0);
  const ethereum = chains.find((c) => c.chainId === 1);
  const evmChains = chains.filter((c) => !isFeaturedChain(c.chainId));

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
            GAS SURFER
          </h1>
          <p className="text-surf-600 dark:text-surf-300 text-lg md:text-xl tracking-widest uppercase">
            Ride the network when it's cheap
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
            <CurrencySelector value={currency} onChange={setCurrency} />
            {!loading && chains.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={refetch}
                  className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
                  title="Refresh gas prices now"
                >
                  ↻ Refresh
                </button>
                {latestUpdate > 0 && (
                  <LastUpdated timestamp={latestUpdate} className="text-surf-600 dark:text-surf-400/90 text-sm" />
                )}
              </>
            )}
          </div>
          {!loading && cheapestChain && chains.length > 1 && (
            <p className="mt-3 text-surf-700 dark:text-foam/90 text-sm font-medium">
              🏄 Best deal right now: <span className="text-slate-900 dark:text-white">{cheapestChain.name}</span>
              {' · '}
              <span className="text-surf-600 dark:text-surf-200 font-mono">{feeUnitLabel(cheapestChain.chainId)}</span>
            </p>
          )}
        </header>

        {loading && chains.length === 0 ? (
          <div className="animate-in fade-in duration-300" aria-busy="true" aria-live="polite">
            <p className="text-surf-600 dark:text-surf-400/80 text-sm text-center mb-6">Loading gas prices…</p>
            <PageSkeletons />
          </div>
        ) : error && chains.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="px-6 py-3 rounded-xl glass border border-slate-300/50 dark:border-white/20 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-white"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500" key="loaded">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-10">
                <FeaturedChainWidget
                  chain={bitcoin ?? null}
                  title="Bitcoin"
                  theme="bitcoin"
                  selectedChainId={selectedChainId}
                  onSelectChain={setSelectedChainId}
                  prices={prices}
                  currency={currency}
                  feeAverages={bitcoin ? feeAverages[bitcoin.chainId] : undefined}
                  isCheapest={cheapestChain?.chainId === bitcoin?.chainId}
                />
                <FeaturedChainWidget
                  chain={ethereum ?? null}
                  title="Ethereum"
                  theme="ethereum"
                  selectedChainId={selectedChainId}
                  onSelectChain={setSelectedChainId}
                  prices={prices}
                  currency={currency}
                  feeAverages={ethereum ? feeAverages[ethereum.chainId] : undefined}
                  isCheapest={cheapestChain?.chainId === ethereum?.chainId}
                />
              </div>
              <h2 className="font-display text-2xl tracking-wider text-surf-700 dark:text-surf-200 mb-4">
                EVM chains
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {evmChains.map((chain) => (
                  <ChainCard
                    key={chain.chainId}
                    chain={chain}
                    coinGeckoId={getCoinGeckoId(chain.chainId)}
                    prices={prices}
                    currency={currency}
                    feeAverages={feeAverages[chain.chainId]}
                    isPrimary={chain.chainId === selectedChainId}
                    isCheapest={cheapestChain?.chainId === chain.chainId}
                    onClick={() => setSelectedChainId(chain.chainId)}
                  />
                ))}
              </div>
            </section>

            {primary && chartValues.length >= 2 && (
              <section className="mb-10">
                <h2 className="font-display text-2xl tracking-wider text-surf-700 dark:text-surf-200 mb-4">
                  Recent trend · {primary.name}
                </h2>
                <div className="flex justify-center">
                  <MiniChart
                    values={chartValues}
                    label={`Standard (${feeUnitLabel(primary.chainId)}) — last ${chartValues.length} updates`}
                    referenceValue={feeAverages[primary.chainId]?.avg7d}
                  />
                </div>
              </section>
            )}

            <footer className="text-center text-slate-500 dark:text-white/40 text-sm">
              <p>Gas every ~12s · Prices every ~1min · RPC + CoinGecko</p>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
