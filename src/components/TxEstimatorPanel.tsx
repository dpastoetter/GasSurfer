import { useState, useMemo } from 'react';
import type { ChainGas, Currency } from '../types';
import { formatGwei, gasCostInToken, formatFiat, feeUnitLabel } from '../types';
import { getPriceInCurrency } from '../useTokenPrices';
import { useI18n } from '../i18n/I18nContext';

const PRESETS: { key: string; gas: number }[] = [
  { key: 'txPresetErc20', gas: 65_000 },
  { key: 'txPresetNft', gas: 200_000 },
  { key: 'txPresetSwap', gas: 180_000 },
];

interface TxEstimatorPanelProps {
  chain: ChainGas | undefined;
  coinGeckoId: string;
  prices: Record<string, Partial<Record<Currency, number>>>;
  currency: Currency;
}

export function TxEstimatorPanel({ chain, coinGeckoId, prices, currency }: TxEstimatorPanelProps) {
  const { t } = useI18n();
  const [gasLimit, setGasLimit] = useState(150_000);

  const { token, fiat } = useMemo(() => {
    if (!chain || chain.chainId === 0) return { token: null as number | null, fiat: null as number | null };
    const gwei = chain.gas.standard;
    const token = gasCostInToken(chain.chainId, gwei, gasLimit);
    const p = getPriceInCurrency(prices, coinGeckoId, currency);
    const fiat = p != null && p > 0 ? token * p : null;
    return { token, fiat };
  }, [chain, coinGeckoId, currency, gasLimit, prices]);

  if (!chain || chain.chainId === 0) return null;

  return (
    <div className="rounded-2xl glass border border-slate-200/50 dark:border-white/10 p-4 mb-6 text-sm">
      <h3 className="font-display text-lg tracking-wide text-slate-800 dark:text-white mb-2">{t('txEstimatorTitle')}</h3>
      <p className="text-slate-500 dark:text-white/45 text-xs mb-3">{t('txEstimatorHint')}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setGasLimit(p.gas)}
            className="rounded-lg border border-slate-300/50 dark:border-white/20 px-2 py-1 text-xs text-slate-700 dark:text-surf-200 hover:bg-slate-200/40 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
          >
            {t(p.key as 'txPresetErc20')}
          </button>
        ))}
      </div>
      <label className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-surf-300 mb-2">
        <span>{t('txGasLimit')}</span>
        <input
          type="number"
          min={21_000}
          step={1000}
          value={gasLimit}
          onChange={(e) => setGasLimit(Math.max(21_000, parseInt(e.target.value, 10) || 21_000))}
          className="w-28 rounded-lg border border-slate-300/50 dark:border-white/20 bg-white/80 dark:bg-surf-900/40 px-2 py-1 text-slate-800 dark:text-white"
        />
      </label>
      <p className="text-slate-700 dark:text-surf-200 font-mono text-sm">
        ≈ {token != null ? token.toPrecision(4) : '—'} {chain.symbol} · {formatGwei(chain.gas.standard)} {feeUnitLabel(chain.chainId)}
      </p>
      {fiat != null && (
        <p className="text-surf-600 dark:text-surf-300 text-sm mt-1">
          ≈ {formatFiat(fiat, currency)} <span className="text-slate-400 dark:text-white/40">({t('txEstimatorFiatNote')})</span>
        </p>
      )}
    </div>
  );
}
