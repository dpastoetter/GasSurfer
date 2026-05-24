import type { ChainGas, Currency } from '../types';
import { gasCostInToken, formatFiat } from '../types';
import { getCoinGeckoId } from '../useGasPrices';
import { getPriceInCurrency } from '../useTokenPrices';
import type { TxPresetUrl } from './urlQuerySchema';
import { TX_PRESET_GAS_LIMIT } from './urlQuerySchema';

export type ActionCostRow = {
  chain: ChainGas;
  fiat: number;
  fiatLabel: string;
};

export function gasLimitForAction(preset: TxPresetUrl | 'transfer'): number {
  if (preset === 'transfer') return 21_000;
  return TX_PRESET_GAS_LIMIT[preset];
}

export function rankChainsByActionCost(
  chains: ChainGas[],
  prices: Record<string, Partial<Record<Currency, number>>>,
  currency: Currency,
  gasLimit: number,
  limit = 5
): ActionCostRow[] {
  const rows: ActionCostRow[] = [];
  for (const chain of chains) {
    const token = gasCostInToken(chain.chainId, chain.gas.standard, gasLimit);
    const price = getPriceInCurrency(prices, getCoinGeckoId(chain.chainId), currency);
    if (price == null || price <= 0) continue;
    const fiat = token * price;
    rows.push({ chain, fiat, fiatLabel: formatFiat(fiat, currency) });
  }
  rows.sort((a, b) => a.fiat - b.fiat);
  return rows.slice(0, limit);
}
