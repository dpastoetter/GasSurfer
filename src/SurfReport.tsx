import type { SurfCondition, Currency } from './types';
import { formatGwei, gasCostInToken, formatFiat, feeUnitLabel, costLabel } from './types';
import { getPriceInCurrency } from './useTokenPrices';
import { FeeAveragesDisplay } from './FeeAveragesDisplay';
import type { FeeAverages } from './feeHistory';

const LABELS: Record<SurfCondition, { label: string; sub: string; emoji: string }> = {
  'surfs-up': { label: "Surf's up", sub: 'Prime time to ride', emoji: '🏄' },
  smooth: { label: 'Smooth', sub: 'Good conditions', emoji: '🌊' },
  choppy: { label: 'Choppy', sub: 'Consider waiting', emoji: '〰️' },
  storm: { label: 'Storm', sub: 'Hold off if you can', emoji: '⛈️' },
};

interface SurfReportProps {
  condition: SurfCondition;
  gwei: number;
  chainName: string;
  chainId: number;
  coinGeckoId: string;
  prices: Record<string, Partial<Record<Currency, number>>>;
  currency: Currency;
  feeAverages?: FeeAverages;
}

export function SurfReport({ condition, gwei, chainName, coinGeckoId, prices, currency, chainId, feeAverages }: SurfReportProps) {
  const { label, sub, emoji } = LABELS[condition];
  const costToken = gasCostInToken(chainId, gwei);
  const price = getPriceInCurrency(prices, coinGeckoId, currency);
  const costFiat = price != null ? costToken * price : null;

  return (
    <div className="text-center">
      <div
        className="inline-flex items-center justify-center w-24 h-24 rounded-full text-5xl mb-4 animate-float glass-strong"
        style={{ animationDuration: '3s' }}
      >
        {emoji}
      </div>
      <h1 className="font-display text-5xl md:text-7xl tracking-widest text-white mb-2">
        {label}
      </h1>
      <p className="text-surf-200 text-lg md:text-xl mb-1">{sub}</p>
      <p className="text-surf-400/90 text-sm">
        {chainName} · <span className="text-foam font-semibold">{formatGwei(gwei)} {feeUnitLabel(chainId)}</span>
      </p>
      {costFiat != null && (
        <p className="text-surf-300 text-base mt-2">
          {costLabel(chainId)} ≈ <span className="text-foam font-semibold">{formatFiat(costFiat, currency)}</span>
        </p>
      )}
      {feeAverages && (
        <div className="mt-6 max-w-md mx-auto">
          <FeeAveragesDisplay averages={feeAverages} unitLabel={feeUnitLabel(chainId)} />
        </div>
      )}
    </div>
  );
}
