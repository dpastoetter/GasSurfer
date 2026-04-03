import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { I18nProvider } from './i18n/I18nContext';
import { readUrlParams } from './hooks/useUrlSync';

const urlInit = readUrlParams();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider initialLocale={urlInit.lang}>
      <App />
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
