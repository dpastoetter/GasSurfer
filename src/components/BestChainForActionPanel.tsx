import { useMemo } from 'react';
import type { ChainGas, Currency } from '../types';
import { useI18n } from '../i18n/I18nContext';
import type { TxPresetUrl } from '../lib/urlQuerySchema';
import { gasLimitForAction, rankChainsByActionCost } from '../lib/actionCostRank';
import { conditionLabels } from '../i18n/messages';

type ActionIntent = TxPresetUrl | 'transfer';

const INTENTS: { key: ActionIntent; labelKey: string }[] = [
  { key: 'transfer', labelKey: 'actionIntentTransfer' },
  { key: 'erc20', labelKey: 'txPresetErc20' },
  { key: 'nft', labelKey: 'txPresetNft' },
  { key: 'swap', labelKey: 'txPresetSwap' },
];

interface BestChainForActionPanelProps {
  chains: ChainGas[];
  selectedChainId: number;
  currency: Currency;
  prices: Record<string, Partial<Record<Currency, number>>>;
  intent: ActionIntent;
  onIntentChange: (intent: ActionIntent) => void;
  onSelectChain: (chainId: number) => void;
}

export function BestChainForActionPanel({
  chains,
  selectedChainId,
  currency,
  prices,
  intent,
  onIntentChange,
  onSelectChain,
}: BestChainForActionPanelProps) {
  const { t, locale } = useI18n();
  const labels = conditionLabels(locale);
  const gasLimit = gasLimitForAction(intent);

  const ranked = useMemo(
    () => rankChainsByActionCost(chains, prices, currency, gasLimit, 5),
    [chains, prices, currency, gasLimit]
  );

  const best = ranked[0];

  return (
    <div className="rounded-2xl glass border border-slate-200/50 dark:border-white/10 p-4 mb-6 text-sm">
      <h3 className="font-display text-lg tracking-wide text-slate-800 dark:text-white mb-2">{t('actionCostTitle')}</h3>
      <p className="text-xs text-slate-500 dark:text-white/45 mb-3 leading-relaxed">{t('actionCostHint')}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {INTENTS.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => onIntentChange(key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium border focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50 ${
              intent === key
                ? 'border-surf-500/50 bg-surf-400/20 text-slate-900 dark:text-white'
                : 'border-slate-300/50 dark:border-white/20 text-slate-600 dark:text-surf-200'
            }`}
          >
            {t(labelKey as 'actionIntentTransfer' | 'txPresetErc20' | 'txPresetNft' | 'txPresetSwap')}
          </button>
        ))}
      </div>
      {ranked.length === 0 ? (
        <p className="text-slate-500 dark:text-white/50">{t('actionCostNoPrices')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">{t('actionCostCaption')}</caption>
            <thead>
              <tr className="text-slate-500 dark:text-white/50 border-b border-slate-200/50 dark:border-white/10">
                <th className="py-2 pr-3 font-medium">{t('compareColChain')}</th>
                <th className="py-2 pr-3 font-medium">{t('compareColCondition')}</th>
                <th className="py-2 font-medium">{t('compareColFiat')}</th>
                <th scope="col" className="py-2 pl-2 font-medium">
                  <span className="sr-only">{t('actionCostSwitch')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ chain, fiatLabel }) => {
                const isSelected = chain.chainId === selectedChainId;
                const isBest = best?.chain.chainId === chain.chainId;
                return (
                  <tr
                    key={chain.chainId}
                    className={`border-b border-slate-100/60 dark:border-white/5 ${isSelected ? 'bg-surf-400/10' : ''}`}
                  >
                    <td className="py-2 pr-3 font-medium text-slate-800 dark:text-white">
                      {chain.name}
                      {isBest && (
                        <span className="ml-1 text-surf-600 dark:text-surf-300">({t('actionCostBest')})</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">{labels[chain.condition].label}</td>
                    <td className="py-2 font-mono">{fiatLabel}</td>
                    <td className="py-2 pl-2">
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => onSelectChain(chain.chainId)}
                          className="rounded-lg px-2 py-1 text-xs text-surf-700 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
                        >
                          {t('actionCostSwitch')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-500 dark:text-white/45 mt-3">{t('actionCostBridgeNote')}</p>
    </div>
  );
}
