import { useState } from 'react';
import type { ChainGas, Currency } from '../types';
import { formatFiat, gasCostInToken } from '../types';
import { getCoinGeckoId } from '../useGasPrices';
import { getPriceInCurrency } from '../useTokenPrices';
import { useI18n } from '../i18n/I18nContext';
import {
  dismissCheapestCalloutForWeek,
  isCheapestCalloutDismissed,
} from '../lib/cheapestCalloutDismiss';

interface CheapestChainCalloutProps {
  primary: ChainGas | undefined;
  cheapestChain: ChainGas | null;
  chainCount: number;
  currency: Currency;
  prices: Record<string, Partial<Record<Currency, number>>>;
  onSwitchChain: (chainId: number) => void;
}

function standardTxFiat(
  chain: ChainGas,
  currency: Currency,
  prices: Record<string, Partial<Record<Currency, number>>>
): number | null {
  const token = gasCostInToken(chain.chainId, chain.gas.standard);
  const price = getPriceInCurrency(prices, getCoinGeckoId(chain.chainId), currency);
  if (price == null || price <= 0) return null;
  return token * price;
}

export function CheapestChainCallout({
  primary,
  cheapestChain,
  chainCount,
  currency,
  prices,
  onSwitchChain,
}: CheapestChainCalloutProps) {
  const { t, ti } = useI18n();
  const [dismissed, setDismissed] = useState(() => isCheapestCalloutDismissed());

  if (
    dismissed ||
    !primary ||
    !cheapestChain ||
    chainCount <= 1 ||
    primary.chainId === cheapestChain.chainId
  ) {
    return null;
  }

  const cheapestFiat = standardTxFiat(cheapestChain, currency, prices);
  const primaryFiat = standardTxFiat(primary, currency, prices);
  if (cheapestFiat == null || primaryFiat == null) return null;

  const onDismiss = () => {
    dismissCheapestCalloutForWeek();
    setDismissed(true);
  };

  return (
    <div
      className="mb-6 rounded-2xl border border-surf-400/35 bg-surf-400/10 px-4 py-3 text-sm text-slate-800 dark:text-surf-100"
      role="status"
      aria-live="polite"
    >
      <p className="leading-relaxed mb-3">
        {ti('cheapestCalloutBody', {
          cheapest: cheapestChain.name,
          primary: primary.name,
          cheapestFiat: formatFiat(cheapestFiat, currency),
          primaryFiat: formatFiat(primaryFiat, currency),
        })}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSwitchChain(cheapestChain.chainId)}
          className="rounded-xl glass border border-surf-500/40 dark:border-surf-300/30 px-3 py-2 font-medium text-slate-800 dark:text-white hover:bg-surf-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
        >
          {ti('cheapestCalloutSwitch', { name: cheapestChain.name })}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl px-3 py-2 text-slate-600 dark:text-surf-200/90 hover:bg-slate-200/40 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
        >
          {t('cheapestCalloutDismiss')}
        </button>
      </div>
    </div>
  );
}
