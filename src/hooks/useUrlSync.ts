import { useEffect, useCallback } from 'react';
import type { Currency } from '../types';

const CHAIN_PARAM = 'chain';
const CURRENCY_PARAM = 'currency';
const LANG_PARAM = 'lang';

export type UrlInitial = {
  chainId: number | null;
  currency: Currency | null;
  lang: 'en' | 'de' | null;
};

export function readUrlParams(): UrlInitial {
  if (typeof window === 'undefined') return { chainId: null, currency: null, lang: null };
  const p = new URLSearchParams(window.location.search);
  const c = p.get(CHAIN_PARAM);
  const chainId = c != null && c !== '' ? parseInt(c, 10) : NaN;
  const cur = p.get(CURRENCY_PARAM);
  const validCur = ['usd', 'eur', 'gbp', 'jpy', 'chf', 'cad', 'aud'].includes(cur ?? '') ? (cur as Currency) : null;
  const lang = p.get(LANG_PARAM);
  return {
    chainId: Number.isFinite(chainId) ? chainId : null,
    currency: validCur,
    lang: lang === 'de' || lang === 'en' ? lang : null,
  };
}

/** Keep URL query string in sync with app state (replaceState, no extra history entries). */
export function useUrlSync(selectedChainId: number, currency: Currency, locale: string) {
  const pushState = useCallback(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    p.set(CHAIN_PARAM, String(selectedChainId));
    p.set(CURRENCY_PARAM, currency);
    p.set(LANG_PARAM, locale);
    const next = `${window.location.pathname}?${p.toString()}`;
    window.history.replaceState(null, '', next);
  }, [selectedChainId, currency, locale]);

  useEffect(() => {
    pushState();
  }, [pushState]);
}
