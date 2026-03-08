type Theme = 'light' | 'dark';

export type { Theme };

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({ theme, onToggle, className = '' }: ThemeToggleProps) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all
        border border-white/20 dark:border-white/20
        bg-white/10 dark:bg-white/10
        text-slate-700 dark:text-surf-200
        hover:bg-white/20 dark:hover:bg-white/15
        focus:outline-none focus:ring-2 focus:ring-surf-400/50 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-deep-950
        ${className}
      `}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
