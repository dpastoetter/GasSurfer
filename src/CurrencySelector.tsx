import type { Currency } from './types';
import { CURRENCIES } from './types';

interface CurrencySelectorProps {
  value: Currency;
  onChange: (c: Currency) => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-surf-300 text-sm font-medium">Prices in</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Currency)}
        className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white font-medium cursor-pointer hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-surf-400/50"
      >
        {CURRENCIES.map((c) => (
          <option key={c.value} value={c.value} className="bg-surf-900 text-white">
            {c.symbol} {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
