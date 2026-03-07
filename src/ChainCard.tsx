import type { ChainGas, SurfCondition, Currency } from './types';
import { formatGwei, gasCostInToken, formatFiat, feeUnitLabel, costLabel, BITCOIN_CHAIN_ID } from './types';
import { getPriceInCurrency } from './useTokenPrices';
import { FeeAveragesDisplay } from './FeeAveragesDisplay';
import type { FeeAverages } from './feeHistory';

const CONDITION_COLORS: Record<SurfCondition, string> = {
  'surfs-up': 'from-emerald-500/30 to-surf-500/30 border-emerald-400/40',
  smooth: 'from-surf-500/30 to-cyan-500/30 border-surf-400/40',
  choppy: 'from-amber-500/20 to-orange-500/20 border-amber-400/40',
  storm: 'from-red-500/20 to-storm/30 border-red-400/40',
};

const CONDITION_LABELS: Record<SurfCondition, string> = {
  'surfs-up': "Surf's up",
  smooth: 'Smooth',
  choppy: 'Choppy',
  storm: 'Storm',
};

interface ChainCardProps {
  chain: ChainGas;
  coinGeckoId: string;
  prices: Record<string, Partial<Record<Currency, number>>>;
  currency: Currency;
  feeAverages?: FeeAverages;
  isPrimary?: boolean;
  featured?: boolean;
  onClick?: () => void;
}

export function ChainCard({ chain, coinGeckoId, prices, currency, feeAverages, isPrimary, featured, onClick }: ChainCardProps) {
  const gradient = CONDITION_COLORS[chain.condition];
  const conditionLabel = CONDITION_LABELS[chain.condition];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left rounded-2xl glass border bg-gradient-to-br ${gradient}
        transition-all duration-300 hover:scale-[1.02] hover:border-white/20
        ${featured ? 'p-6 md:p-7 border-2 border-white/20 shadow-lg shadow-surf-900/30' : 'p-5'}
        ${isPrimary ? 'ring-2 ring-surf-400/50 ring-offset-2 ring-offset-deep-950' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`font-display tracking-wide text-white ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
          {chain.name}
        </span>
        {featured && (
          <span className="text-[10px] uppercase tracking-widest text-surf-400/80 font-semibold">Featured</span>
        )}
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            chain.condition === 'surfs-up'
              ? 'bg-emerald-500/30 text-emerald-200'
              : chain.condition === 'storm'
                ? 'bg-red-500/30 text-red-200'
                : 'bg-white/10 text-surf-200'
          }`}
        >
          {conditionLabel}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-white/50">Slow</p>
          <p className="text-foam font-mono font-semibold">{formatGwei(chain.gas.slow)}</p>
        </div>
        <div>
          <p className="text-white/50">Standard</p>
          <p className="text-white font-mono font-semibold">{formatGwei(chain.gas.standard)}</p>
        </div>
        <div>
          <p className="text-white/50">Fast</p>
          <p className="text-surf-300 font-mono font-semibold">{formatGwei(chain.gas.fast)}</p>
        </div>
      </div>
      <p className="text-white/40 text-xs mt-2">{feeUnitLabel(chain.chainId)}</p>
      {chain.chainId === BITCOIN_CHAIN_ID && (
        <p className="text-white/30 text-[10px] mt-0.5">~1 hr · ~30 min · next block</p>
      )}
      {(() => {
        const costToken = gasCostInToken(chain.chainId, chain.gas.standard);
        const price = getPriceInCurrency(prices, coinGeckoId, currency);
        const costFiat = price != null ? costToken * price : null;
        return costFiat != null ? (
          <p className="text-surf-300 text-sm mt-2">
            {costLabel(chain.chainId)} ≈ {formatFiat(costFiat, currency)}
          </p>
        ) : null;
      })()}
      {feeAverages && (
        <FeeAveragesDisplay
          averages={feeAverages}
          unitLabel={feeUnitLabel(chain.chainId)}
          compact
        />
      )}
    </button>
  );
}
