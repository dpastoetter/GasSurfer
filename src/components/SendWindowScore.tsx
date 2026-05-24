import { useMemo } from 'react';
import type { ChainGas } from '../types';
import type { FeeAverages } from '../feeHistory';
import { useI18n } from '../i18n/I18nContext';
import {
  computeSendWindowScore,
  sendWindowVerdictLabelKey,
  type SendWindowVerdict,
} from '../lib/sendWindowScore';
import { buildFeeReminderIcs, downloadIcsFile } from '../lib/sendWindowIcs';
import { useCalmHourNow } from '../hooks/useCalmHourNow';

interface SendWindowScoreProps {
  chain: ChainGas;
  feeAverages?: FeeAverages;
  hasCheaperChain: boolean;
}

const VERDICT_STYLES: Record<SendWindowVerdict, string> = {
  great: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
  ok: 'border-surf-400/35 bg-surf-400/10 text-slate-800 dark:text-surf-100',
  wait: 'border-amber-400/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
};

export function SendWindowScore({ chain, feeAverages, hasCheaperChain }: SendWindowScoreProps) {
  const { t, ti } = useI18n();
  const calmHourNow = useCalmHourNow(chain.chainId);

  const result = useMemo(
    () =>
      computeSendWindowScore({
        condition: chain.condition,
        standardFee: chain.gas.standard,
        avg7d: feeAverages?.avg7d,
        calmHourNow,
        hasCheaperChain,
      }),
    [chain.condition, chain.gas.standard, feeAverages?.avg7d, calmHourNow, hasCheaperChain]
  );

  const labelKey = sendWindowVerdictLabelKey(result.verdict);

  return (
    <div
      className={`mt-6 max-w-md mx-auto rounded-2xl border px-4 py-3 text-sm text-left ${VERDICT_STYLES[result.verdict]}`}
      role="status"
      aria-live="polite"
    >
      <p className="font-display text-lg tracking-wide mb-1">{t(labelKey)}</p>
      <p className="leading-relaxed opacity-95">
        {ti(result.detailKey, {
          below: result.belowAvg7d ? t('sendWindowYes') : t('sendWindowNo'),
          calm: result.calmHour ? t('sendWindowYes') : t('sendWindowNo'),
        })}
      </p>
      {result.cheaperElsewhere && (
        <p className="text-xs mt-2 opacity-80">{t('sendWindowCheaperHint')}</p>
      )}
      <button
        type="button"
        onClick={() => downloadIcsFile(buildFeeReminderIcs(chain.name))}
        className="mt-3 rounded-xl px-3 py-2 text-xs font-medium border border-current/25 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
      >
        {t('sendWindowRemind')}
      </button>
    </div>
  );
}
