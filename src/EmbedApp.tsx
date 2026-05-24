import { useState, useMemo, useEffect } from 'react';
import { useGasPrices, getCoinGeckoId } from './useGasPrices';
import { useTokenPrices } from './useTokenPrices';
import { useFeeAverages } from './useFeeAverages';
import { useMergedChartHistory } from './useMergedChartHistory';
import { SurfReport } from './SurfReport';
import { MiniChart } from './MiniChart';
import { CurrencySelector } from './CurrencySelector';
import { LastUpdated } from './LastUpdated';
import { ThemeToggle, type Theme } from './ThemeToggle';
import { LocaleSelector } from './components/LocaleSelector';
import { SendWindowScore } from './components/SendWindowScore';
import { CheapestChainCallout } from './components/CheapestChainCallout';
import { readUrlParams } from './hooks/useUrlSync';
import { useUrlSync } from './hooks/useUrlSync';
import { useI18n } from './i18n/I18nContext';
import { getPriceInCurrency } from './useTokenPrices';
import { gasCostInToken } from './types';
import type { Currency } from './types';
import { feeUnitLabel } from './types';

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

/** Minimal iframe-friendly view: `/embed?chain=1` */
export default function EmbedApp() {
  const { t, ti, locale } = useI18n();
  const [urlSnap] = useState(() => readUrlParams());
  const { chains, loading, refetch } = useGasPrices(12_000);
  const { prices } = useTokenPrices(60_000);
  const feeAverages = useFeeAverages(chains);
  const [selectedChainId, setSelectedChainId] = useState(() => urlSnap.chainId ?? 1);
  const [currency, setCurrency] = useState<Currency>(() => urlSnap.currency ?? 'usd');
  const [theme, setTheme] = useState<Theme>(loadTheme);

  const primary = chains.find((c) => c.chainId === selectedChainId) ?? chains[0];
  const effectiveChainId = primary?.chainId ?? selectedChainId;

  useUrlSync(effectiveChainId, currency, locale, [], null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const { values: chartValues } = useMergedChartHistory(primary, CHART_HISTORY_SIZE);

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
    <div className="min-h-screen wave-bg text-slate-800 dark:text-white font-sans" data-embed="true">
      <main className="max-w-2xl mx-auto px-4 py-6">
        <header className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <span className="font-display text-2xl tracking-widest">{t('appTitle')}</span>
          <ThemeToggle theme={theme} onToggle={() => setTheme((p) => (p === 'dark' ? 'light' : 'dark'))} />
          <LocaleSelector />
          <CurrencySelector value={currency} onChange={setCurrency} />
          <button
            type="button"
            onClick={refetch}
            className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2 text-sm"
          >
            ↻ {t('refresh')}
          </button>
          {latestUpdate > 0 && <LastUpdated timestamp={latestUpdate} className="text-sm" />}
        </header>
        {loading && chains.length === 0 ? (
          <p className="text-center text-sm">{t('loadingGas')}</p>
        ) : primary ? (
          <>
            <div className="glass-strong rounded-3xl p-6 border border-slate-200/50 dark:border-white/10">
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
                feeUncertain={primary.feeUncertain}
              />
              <SendWindowScore
                chain={primary}
                feeAverages={feeAverages[primary.chainId]}
                hasCheaperChain={cheapestChain != null && cheapestChain.chainId !== primary.chainId}
              />
            </div>
            <CheapestChainCallout
              primary={primary}
              cheapestChain={cheapestChain}
              chainCount={chains.length}
              currency={currency}
              prices={prices}
              onSwitchChain={setSelectedChainId}
            />
            {chartValues.length >= 2 && (
              <section className="mt-8">
                <MiniChart
                  values={chartValues}
                  label={ti('chartTrendLabel', { unit: feeUnitLabel(primary.chainId), n: chartValues.length })}
                  referenceValue={feeAverages[primary.chainId]?.avg7d}
                />
              </section>
            )}
          </>
        ) : null}
        <p className="text-center text-xs text-slate-500 dark:text-white/45 mt-8">
          <a href="https://gassurfer.app" className="underline">
            gassurfer.app
          </a>
        </p>
      </main>
    </div>
  );
}
