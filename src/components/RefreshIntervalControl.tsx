import { useI18n } from '../i18n/I18nContext';
import type { RefreshIntervalChoice } from '../hooks/useGasRefreshInterval';

interface RefreshIntervalControlProps {
  value: RefreshIntervalChoice;
  onChange: (v: RefreshIntervalChoice) => void;
}

export function RefreshIntervalControl({ value, onChange }: RefreshIntervalControlProps) {
  const { t } = useI18n();
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-surf-300">
      <span className="sr-only sm:not-sr-only">{t('refreshEvery')}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as RefreshIntervalChoice)}
        className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2 text-slate-800 dark:text-white bg-white/80 dark:bg-surf-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
        aria-label={t('refreshEvery')}
      >
        <option value={6000}>{t('refresh6s')}</option>
        <option value={12000}>{t('refresh12s')}</option>
        <option value={30000}>{t('refresh30s')}</option>
        <option value={0}>{t('refreshPaused')}</option>
      </select>
    </label>
  );
}
