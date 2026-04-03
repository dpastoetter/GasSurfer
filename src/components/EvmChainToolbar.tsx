import { useI18n } from '../i18n/I18nContext';

export type EvmSort = 'fee' | 'name' | 'condition';

interface EvmChainToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sort: EvmSort;
  onSortChange: (v: EvmSort) => void;
}

export function EvmChainToolbar({ search, onSearchChange, sort, onSortChange }: EvmChainToolbarProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
      <label className="flex flex-1 max-w-md items-center gap-2 text-sm text-slate-600 dark:text-surf-300">
        <span className="sr-only">{t('searchChains')}</span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('searchChains')}
          className="flex-1 rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
          autoComplete="off"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-surf-300">
        <span>{t('sortBy')}</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as EvmSort)}
          aria-label={t('sortBy')}
          className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50 bg-white/80 dark:bg-surf-900/40"
        >
          <option value="fee">{t('sortLowestFee')}</option>
          <option value="name">{t('sortName')}</option>
          <option value="condition">{t('sortCondition')}</option>
        </select>
      </label>
    </div>
  );
}
