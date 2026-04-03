import type { Locale } from '../i18n/messages';
import { useI18n } from '../i18n/I18nContext';

export function LocaleSelector() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-surf-300">
      <span className="sr-only">{t('language')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-surf-400/50 bg-white/80 dark:bg-surf-900/40"
        aria-label={t('language')}
      >
        <option value="en">{t('langEn')}</option>
        <option value="de">{t('langDe')}</option>
      </select>
    </label>
  );
}
