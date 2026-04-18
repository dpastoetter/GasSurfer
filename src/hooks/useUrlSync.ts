import { useEffect, useCallback } from 'react';
import type { Currency } from '../types';
import type { TxPresetUrl } from '../lib/urlQuerySchema';
import { parseCompareQueryParam, parseTxPresetQueryParam } from '../lib/urlQuerySchema';

const CHAIN_PARAM = 'chain';
const CURRENCY_PARAM = 'currency';
const LANG_PARAM = 'lang';
const COMPARE_PARAM = 'compare';
const TX_PRESET_PARAM = 'txPreset';

export type UrlInitial = {
  chainId: number | null;
  currency: Currency | null;
  lang: 'en' | 'de' | 'es' | null;
  /** Up to three chain IDs from `compare=` (allowlisted only). */
  compareIds: number[];
  /** Tx estimator preset from `txPreset=erc20|nft|swap`. */
  txPreset: TxPresetUrl | null;
};

export function readUrlParams(): UrlInitial {
  if (typeof window === 'undefined') {
    return { chainId: null, currency: null, lang: null, compareIds: [], txPreset: null };
  }
  const p = new URLSearchParams(window.location.search);
  const c = p.get(CHAIN_PARAM);
  const chainId = c != null && c !== '' ? parseInt(c, 10) : NaN;
  const cur = p.get(CURRENCY_PARAM);
  const validCur = ['usd', 'eur', 'gbp', 'jpy', 'chf', 'cad', 'aud'].includes(cur ?? '') ? (cur as Currency) : null;
  const lang = p.get(LANG_PARAM);
  const compareIds = parseCompareQueryParam(p.get(COMPARE_PARAM));
  const txPreset = parseTxPresetQueryParam(p.get(TX_PRESET_PARAM));
  return {
    chainId: Number.isFinite(chainId) ? chainId : null,
    currency: validCur,
    lang: lang === 'de' || lang === 'en' || lang === 'es' ? lang : null,
    compareIds,
    txPreset,
  };
}

/** Keep URL query string in sync with app state (replaceState, no extra history entries). */
export function useUrlSync(
  selectedChainId: number,
  currency: Currency,
  locale: string,
  compareIds: readonly number[],
  txPreset: TxPresetUrl | null
) {
  const pushState = useCallback(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    p.set(CHAIN_PARAM, String(selectedChainId));
    p.set(CURRENCY_PARAM, currency);
    p.set(LANG_PARAM, locale);
    if (compareIds.length > 0) {
      p.set(COMPARE_PARAM, compareIds.join(','));
    } else {
      p.delete(COMPARE_PARAM);
    }
    if (txPreset != null) {
      p.set(TX_PRESET_PARAM, txPreset);
    } else {
      p.delete(TX_PRESET_PARAM);
    }
    const next = `${window.location.pathname}?${p.toString()}`;
    window.history.replaceState(null, '', next);
  }, [selectedChainId, currency, locale, compareIds, txPreset]);

  useEffect(() => {
    pushState();
  }, [pushState]);
}
