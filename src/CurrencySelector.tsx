import type { Currency } from './types';
import { CURRENCIES } from './types';

interface CurrencySelectorProps {
  value: Currency;
  onChange: (c: Currency) => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-slate-600 dark:text-surf-300 text-sm font-medium sr-only sm:not-sr-only">Prices in</span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select currency">
        {CURRENCIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={`
              rounded-xl px-3.5 py-2 text-sm font-medium transition-all
              focus:outline-none focus:ring-2 focus:ring-surf-400/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-deep-950
              ${value === c.value
                ? 'bg-surf-500/50 dark:bg-surf-500/40 text-white border border-surf-500 dark:border-surf-400/50 shadow-md'
                : 'bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-surf-200 border border-slate-300/50 dark:border-white/20 hover:bg-slate-300/60 dark:hover:bg-white/15'
              }
            `}
            title={c.label}
          >
            {c.symbol} <span className="hidden sm:inline">{c.value.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
