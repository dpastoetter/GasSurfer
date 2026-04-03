import { useI18n } from './i18n/I18nContext';
import type { Theme } from './ThemeToggle.types';

export type { Theme } from './ThemeToggle.types';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}

function ThemeToggleInner({
  isDark,
  onToggle,
  className,
}: {
  isDark: boolean;
  onToggle: () => void;
  className: string;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all
        border border-slate-300/50 dark:border-white/20
        bg-slate-200/60 dark:bg-white/10
        text-slate-700 dark:text-surf-200
        hover:bg-slate-300/60 dark:hover:bg-white/15
        focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-deep-950
        ${className}
      `}
      title={isDark ? t('themeToLight') : t('themeToDark')}
      aria-label={isDark ? t('themeToLight') : t('themeToDark')}
    >
      {isDark ? `☀️ ${t('themeLight')}` : `🌙 ${t('themeDark')}`}
    </button>
  );
}

export function ThemeToggle({ theme, onToggle, className = '' }: ThemeToggleProps) {
  const isDark = theme === 'dark';
  return <ThemeToggleInner isDark={isDark} onToggle={onToggle} className={className} />;
}
