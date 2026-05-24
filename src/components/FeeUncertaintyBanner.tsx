import { useI18n } from '../i18n/I18nContext';

export function FeeUncertaintyBanner() {
  const { t } = useI18n();
  return (
    <p
      className="mt-2 text-xs text-amber-800 dark:text-amber-200/90 bg-amber-500/15 border border-amber-500/30 rounded-lg px-3 py-2 max-w-md mx-auto"
      role="status"
    >
      {t('feeUncertain')}
    </p>
  );
}
