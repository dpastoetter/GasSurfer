import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';

const DISMISS_KEY = 'gas-surfer-install-prompt-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

interface InstallPromptProps {
  hidden?: boolean;
}

export function InstallPrompt({ hidden = false }: InstallPromptProps) {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  if (hidden || dismissed || deferred == null) return null;

  const onInstall = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const onDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
    setDeferred(null);
  };

  return (
    <div
      className="mb-4 rounded-xl border border-surf-400/30 bg-surf-400/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm"
      role="region"
      aria-label={t('installPromptAction')}
    >
      <p className="text-slate-700 dark:text-surf-100">{t('installPromptBody')}</p>
      <div className="flex flex-wrap gap-2 shrink-0">
        <button
          type="button"
          onClick={() => void onInstall()}
          className="rounded-xl glass border border-surf-500/40 px-3 py-2 font-medium text-slate-800 dark:text-white hover:bg-surf-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
        >
          {t('installPromptAction')}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl px-3 py-2 text-slate-600 dark:text-surf-200/90 hover:bg-slate-200/40 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
        >
          {t('installPromptDismiss')}
        </button>
      </div>
    </div>
  );
}
