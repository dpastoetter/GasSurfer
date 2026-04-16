import { useRef } from 'react';
import type { ChainGas, Currency } from '../types';
import { formatGwei, gasCostInToken, formatFiat, costLabel } from '../types';
import { getPriceInCurrency } from '../useTokenPrices';
import { useI18n } from '../i18n/I18nContext';
import { conditionLabels } from '../i18n/messages';
import { getCoinGeckoId } from '../useGasPrices';
import { DataFreshness } from './DataFreshness';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ComparePanelProps {
  open: boolean;
  onClose: () => void;
  chains: ChainGas[];
  compareIds: number[];
  prices: Record<string, Partial<Record<Currency, number>>>;
  currency: Currency;
}

export function ComparePanel({ open, onClose, chains, compareIds, prices, currency }: ComparePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);
  const { t, locale } = useI18n();
  const labels = conditionLabels(locale);
  const selected = compareIds
    .map((id) => chains.find((c) => c.chainId === id))
    .filter((c): c is ChainGas => c != null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        className="w-full max-w-4xl max-h-[85vh] overflow-auto rounded-2xl glass-strong border border-slate-200/50 dark:border-white/15 shadow-2xl p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 id="compare-title" className="font-display text-xl tracking-wide text-slate-900 dark:text-white">
            {t('compareTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
          >
            {t('compareClose')}
          </button>
        </div>
        {selected.length === 0 ? (
          <p className="text-slate-500 dark:text-white/50 text-sm">{t('compareEmpty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-white/50">
                  <th className="py-2 pr-3 font-medium">{t('compareColChain')}</th>
                  <th className="py-2 pr-3 font-medium">{t('slow')}</th>
                  <th className="py-2 pr-3 font-medium">{t('standard')}</th>
                  <th className="py-2 pr-3 font-medium">{t('fast')}</th>
                  <th className="py-2 pr-3 font-medium">{t('compareColCondition')}</th>
                  <th className="py-2 pr-3 font-medium">{t('compareColFiat')}</th>
                  <th className="py-2 font-medium">{t('compareColUpdated')}</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((c) => {
                  const cg = getCoinGeckoId(c.chainId);
                  const token = gasCostInToken(c.chainId, c.gas.standard);
                  const p = getPriceInCurrency(prices, cg, currency);
                  const fiat = p != null ? token * p : null;
                  return (
                    <tr key={c.chainId} className="border-b border-slate-100/80 dark:border-white/5">
                      <td className="py-2 pr-3 font-medium text-slate-900 dark:text-white">{c.name}</td>
                      <td className="py-2 pr-3 font-mono">{formatGwei(c.gas.slow)}</td>
                      <td className="py-2 pr-3 font-mono font-semibold">{formatGwei(c.gas.standard)}</td>
                      <td className="py-2 pr-3 font-mono">{formatGwei(c.gas.fast)}</td>
                      <td className="py-2 pr-3">{labels[c.condition].label}</td>
                      <td className="py-2 pr-3">
                        {fiat != null ? (
                          <span>
                            {costLabel(c.chainId)} ≈ {formatFiat(fiat, currency)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 align-top">
                        <DataFreshness
                          key={`${c.chainId}-${c.updatedAt}`}
                          updatedAt={c.updatedAt}
                          dataSource={c.dataSource}
                          fetchMeta={c.fetchMeta}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-400 dark:text-white/35 mt-2">{t('compareFootGwei')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
