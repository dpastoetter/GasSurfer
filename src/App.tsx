import { useState } from 'react';
import { useGasPrices, getCoinGeckoId } from './useGasPrices';
import { useTokenPrices } from './useTokenPrices';
import { useFeeAverages } from './useFeeAverages';
import { useChartHistory } from './useChartHistory';
import { SurfReport } from './SurfReport';
import { ChainCard } from './ChainCard';
import { FeaturedChainWidget } from './FeaturedChainWidget';
import { MiniChart } from './MiniChart';
import { CurrencySelector } from './CurrencySelector';
import type { Currency } from './types';
import { feeUnitLabel, isFeaturedChain } from './types';

const CHART_HISTORY_SIZE = 24;

function App() {
  const { chains, loading, error, refetch } = useGasPrices(12_000);
  const { prices } = useTokenPrices(60_000);
  const feeAverages = useFeeAverages(chains);
  const [selectedChainId, setSelectedChainId] = useState<number>(1);
  const [currency, setCurrency] = useState<Currency>('usd');

  const primary = chains.find((c) => c.chainId === selectedChainId) ?? chains[0];
  const chartValues = useChartHistory(primary, CHART_HISTORY_SIZE);

  const bitcoin = chains.find((c) => c.chainId === 0);
  const ethereum = chains.find((c) => c.chainId === 1);
  const evmChains = chains.filter((c) => !isFeaturedChain(c.chainId));

  return (
    <div className="min-h-screen wave-bg text-white font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-surf-600/20 to-transparent" />
        <div
          className="absolute bottom-0 left-0 w-[200%] h-32 bg-surf-700/10 rounded-[50%] animate-wave"
          style={{ animation: 'wave 8s ease-in-out infinite' }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10 md:mb-14">
          <h1 className="font-display text-6xl md:text-8xl tracking-[0.2em] text-white drop-shadow-lg mb-2">
            GAS SURFER
          </h1>
          <p className="text-surf-300 text-lg md:text-xl tracking-widest uppercase">
            Ride the network when it's cheap
          </p>
          <CurrencySelector value={currency} onChange={setCurrency} />
        </header>

        {loading && chains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-14 h-14 border-4 border-surf-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-surf-300">Loading gas prices…</p>
          </div>
        ) : error && chains.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-red-300 mb-4">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="px-6 py-3 rounded-xl glass border border-white/20 hover:bg-white/10 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <section className="mb-12 md:mb-16">
              <div className="glass-strong rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
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
                />
              </div>
              <h2 className="font-display text-2xl tracking-wider text-surf-200 mb-4">
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
                    onClick={() => setSelectedChainId(chain.chainId)}
                  />
                ))}
              </div>
            </section>

            {primary && chartValues.length >= 2 && (
              <section className="mb-10">
                <h2 className="font-display text-2xl tracking-wider text-surf-200 mb-4">
                  Recent trend · {primary.name}
                </h2>
                <div className="flex justify-center">
                  <MiniChart
                    values={chartValues}
                    label={`Standard (${feeUnitLabel(primary.chainId)}) — last ${chartValues.length} updates`}
                  />
                </div>
              </section>
            )}

            <footer className="text-center text-white/40 text-sm">
              <p>Gas every ~12s · Prices every ~1min · RPC + CoinGecko</p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
