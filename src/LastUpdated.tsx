import { useState, useEffect } from 'react';
import { useI18n } from './i18n/I18nContext';

interface LastUpdatedProps {
  timestamp: number;
  className?: string;
}

function formatRelative(ms: number, locale: string): string {
  const sec = Math.round(ms / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale === 'de' ? 'de' : 'en', { numeric: 'auto' });
  if (sec < 60) return rtf.format(-sec, 'second');
  const min = Math.floor(sec / 60);
  if (min < 60) return rtf.format(-min, 'minute');
  const h = Math.floor(min / 60);
  if (h < 48) return rtf.format(-h, 'hour');
  const d = Math.floor(h / 24);
  return rtf.format(-d, 'day');
}

export function LastUpdated({ timestamp, className = '' }: LastUpdatedProps) {
  const { locale, ti } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const rel = formatRelative(Math.max(0, now - timestamp), locale);
  const tag = locale === 'de' ? 'de-DE' : 'en-US';
  const line = ti('lastUpdated', { time: rel });
  return (
    <span className={className} title={new Date(timestamp).toLocaleString(tag)} aria-live="polite">
      {line}
    </span>
  );
}
