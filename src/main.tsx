import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import EmbedApp from './EmbedApp.tsx';
import BadgeApp from './BadgeApp.tsx';
import { I18nProvider } from './i18n/I18nContext';
import { readUrlParams } from './hooks/useUrlSync';

const urlInit = readUrlParams();
const path = typeof window !== 'undefined' ? window.location.pathname : '/';
const badgeMatch = path.match(/^\/badge\/(\d+)\/?$/);

export function Root() {
  if (path === '/embed' || path.startsWith('/embed/')) {
    return <EmbedApp />;
  }
  if (badgeMatch) {
    const chainId = parseInt(badgeMatch[1]!, 10);
    if (Number.isFinite(chainId)) return <BadgeApp chainId={chainId} />;
  }
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider initialLocale={urlInit.lang}>
      <Root />
    </I18nProvider>
  </StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore */
    });
  });
}
