import { useState, useEffect, useCallback } from 'react';
import type { Currency } from './types';
import { CHAIN_COINGECKO_IDS } from './useGasPrices';
import { COINGECKO_API_BASE } from './config/chains';

const COINGECKO_IDS = [...new Set(Object.values(CHAIN_COINGECKO_IDS))].join(',');
const VS_CURRENCIES: Currency[] = ['usd', 'eur', 'gbp', 'jpy', 'chf', 'cad', 'aud'];

function buildPriceUrl(): string {
  return `${COINGECKO_API_BASE}?ids=${COINGECKO_IDS}&vs_currencies=${VS_CURRENCIES.join(',')}`;
}

export type TokenPrices = Record<string, Partial<Record<Currency, number>>>;

export function useTokenPrices(refreshIntervalMs = 60_000) {
  const [prices, setPrices] = useState<TokenPrices>({});
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(buildPriceUrl());
      const data = await res.json();
      setPrices(data ?? {});
    } catch {
      setPrices({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    if (refreshIntervalMs <= 0) return;
    const jittered = Math.round(refreshIntervalMs * (0.88 + Math.random() * 0.24));
    const id = setInterval(fetchPrices, jittered);
    return () => clearInterval(id);
  }, [fetchPrices, refreshIntervalMs]);

  return { prices, loading, refetch: fetchPrices };
}

export function getPriceInCurrency(
  prices: TokenPrices,
  coinGeckoId: string,
  currency: Currency
): number | null {
  const p = prices[coinGeckoId]?.[currency];
  return p != null && p > 0 ? p : null;
}
