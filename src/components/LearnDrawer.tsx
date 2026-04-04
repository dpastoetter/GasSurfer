import { useI18n } from '../i18n/I18nContext';

interface LearnDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function LearnDrawer({ open, onClose }: LearnDrawerProps) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="learn-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md h-full overflow-y-auto glass-strong border-l border-slate-200/50 dark:border-white/15 shadow-2xl p-5 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 id="learn-title" className="font-display text-xl tracking-wide text-slate-900 dark:text-white">
            {t('learnTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
          >
            {t('learnClose')}
          </button>
        </div>
        <section className="mb-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">{t('learnGweiTitle')}</h3>
          <p className="text-sm text-slate-600 dark:text-surf-300/90 leading-relaxed">{t('learnGweiBody')}</p>
        </section>
        <section className="mb-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">{t('learnL2Title')}</h3>
          <p className="text-sm text-slate-600 dark:text-surf-300/90 leading-relaxed">{t('learnL2Body')}</p>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">{t('learnBtcTitle')}</h3>
          <p className="text-sm text-slate-600 dark:text-surf-300/90 leading-relaxed">{t('learnBtcBody')}</p>
        </section>
      </div>
    </div>
  );
}
