import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

export function EmbedSnippetButton({ chainId }: { chainId: number }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gassurfer.app';
    const src = `${origin}/embed?chain=${chainId}&lang=en`;
    const snippet = `<iframe src="${src}" width="400" height="520" style="border:0;border-radius:12px" title="Gas Surfer" loading="lazy"></iframe>`;
    void navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-surf-200 hover:bg-slate-200/50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
    >
      {copied ? t('embedSnippetCopied') : t('embedCopySnippet')}
    </button>
  );
}
