import { useRef } from 'react';
import type { ChainGas } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { getRpcUrlsForChain } from '../config/chains';
import { explorerUrlForChain } from '../config/explorers';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ChainDetailDrawerProps {
  chain: ChainGas | null;
  open: boolean;
  onClose: () => void;
}

export function ChainDetailDrawer({ chain, open, onClose }: ChainDetailDrawerProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  if (!open || !chain) return null;

  const rpcUrls = getRpcUrlsForChain(chain.chainId);
  const explorer = explorerUrlForChain(chain.chainId);
  const isBtc = chain.chainId === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chain-detail-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl glass-strong border border-slate-200/50 dark:border-white/15 shadow-2xl p-5 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <h2 id="chain-detail-title" className="font-display text-xl tracking-wide text-slate-900 dark:text-white">
            {t('chainDetailTitle')} · {chain.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl px-3 py-2 text-sm text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
          >
            {t('chainDetailClose')}
          </button>
        </div>
        <dl className="space-y-3 text-sm text-slate-700 dark:text-surf-200">
          <div>
            <dt className="text-slate-500 dark:text-white/50 font-medium">{t('chainDetailSymbol')}</dt>
            <dd className="font-mono mt-0.5">{chain.symbol}</dd>
          </div>
          {explorer && (
            <div>
              <dt className="text-slate-500 dark:text-white/50 font-medium">{t('chainDetailExplorer')}</dt>
              <dd className="mt-0.5 break-all">
                <a
                  href={
                    isBtc
                      ? 'https://mempool.space?utm_source=gassurfer'
                      : explorer
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-surf-600 dark:text-surf-300 underline underline-offset-2 hover:text-slate-900 dark:hover:text-white"
                >
                  {isBtc ? t('btcMempoolOpen') : explorer}
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-slate-500 dark:text-white/50 font-medium">
              {isBtc ? t('chainDetailMempool') : t('chainDetailRpc')}
            </dt>
            <dd className="mt-1 space-y-1">
              {rpcUrls.length === 0 ? (
                <span className="text-slate-500 dark:text-white/45">{t('chainDetailNoRpc')}</span>
              ) : (
                rpcUrls.map((u) => (
                  <div key={u} className="font-mono text-xs break-all text-slate-600 dark:text-surf-300/90 bg-slate-100/80 dark:bg-black/20 rounded-lg px-2 py-1.5">
                    {u}
                  </div>
                ))
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
