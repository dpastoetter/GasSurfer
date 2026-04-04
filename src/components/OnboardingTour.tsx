import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

interface OnboardingTourProps {
  open: boolean;
  onDismiss: () => void;
}

const STEP_COUNT = 4;

export function OnboardingTour({ open, onDismiss }: OnboardingTourProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  if (!open) return null;

  const titles = [t('onboardStep1Title'), t('onboardStep2Title'), t('onboardStep3Title'), t('onboardStep4Title')];
  const bodies = [t('onboardStep1Body'), t('onboardStep2Body'), t('onboardStep3Body'), t('onboardStep4Body')];
  const i = Math.min(Math.max(0, step), STEP_COUNT - 1);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <div className="w-full max-w-md rounded-2xl glass-strong border border-slate-200/50 dark:border-white/15 shadow-2xl p-6 md:p-8">
        <p className="text-xs text-slate-500 dark:text-white/45 mb-2">
          {i + 1} / {STEP_COUNT}
        </p>
        <h2 id="onboard-title" className="font-display text-2xl tracking-wide text-slate-900 dark:text-white mb-3">
          {titles[i]}
        </h2>
        <p className="text-slate-600 dark:text-surf-300/90 text-sm leading-relaxed mb-6">{bodies[i]}</p>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl px-4 py-2 text-sm text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
          >
            {t('onboardSkip')}
          </button>
          {i < STEP_COUNT - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-surf-500/40 dark:bg-surf-500/30 text-white border border-surf-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
            >
              {t('onboardNext')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-surf-500/40 dark:bg-surf-500/30 text-white border border-surf-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
            >
              {t('onboardDone')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
