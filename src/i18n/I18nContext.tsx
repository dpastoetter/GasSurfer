import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from './messages';
import { messages, interpolate, type MessageKey } from './messages';

const LOCALE_KEY = 'gas-surfer-locale';

function loadLocale(): Locale {
  try {
    const s = localStorage.getItem(LOCALE_KEY);
    if (s === 'de' || s === 'en') return s;
  } catch {
    /* ignore */
  }
  return 'en';
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey) => string;
  ti: (key: MessageKey, vars: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** When set (e.g. from `?lang=`), overrides persisted locale on first load. */
  initialLocale?: Locale | null;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale === 'en' || initialLocale === 'de') return initialLocale;
    return loadLocale();
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l === 'de' ? 'de' : 'en';
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'de' ? 'de' : 'en';
  }, [locale]);

  const t = useCallback(
    (key: MessageKey) => messages[locale][key] ?? messages.en[key] ?? key,
    [locale]
  );

  const ti = useCallback(
    (key: MessageKey, vars: Record<string, string | number>) => interpolate(t(key), vars),
    [t]
  );

  const value = useMemo(() => ({ locale, setLocale, t, ti }), [locale, setLocale, t, ti]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/* eslint-disable react-refresh/only-export-components -- hook colocated with provider */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
