import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { conditionLabels } from '../i18n/messages';
import type { ConditionTransitionToast as ToastPayload } from '../hooks/useConditionTransition';

interface ConditionTransitionToastProps {
  toast: ToastPayload;
  onDismiss: () => void;
}

function ToastShell({ children }: { children: ReactNode }) {
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div
      className={`mb-4 rounded-xl border border-surf-400/40 bg-surf-500/15 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-800 dark:text-surf-100${
        reduced ? '' : ' animate-in fade-in slide-in-from-bottom-2 duration-300'
      }`}
      role="status"
      aria-live="polite"
    >
      {children}
    </div>
  );
}


export function ConditionTransitionToast({ toast, onDismiss }: ConditionTransitionToastProps) {
  const { t, ti, locale } = useI18n();
  const labels = conditionLabels(locale);
  const fromLabel = labels[toast.from].label;
  const toLabel = labels[toast.to].label;
  const message = toast.improved
    ? ti('conditionToastImproved', { chain: toast.chainName, from: fromLabel, to: toLabel })
    : ti('conditionToastWorsened', { chain: toast.chainName, from: fromLabel, to: toLabel });

  return (
    <ToastShell>
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
      >
        {t('conditionToastDismiss')}
      </button>
    </ToastShell>
  );
}
