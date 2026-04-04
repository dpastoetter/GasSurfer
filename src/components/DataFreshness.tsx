import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';

interface DataFreshnessProps {
  updatedAt: number;
  dataSource?: string;
  className?: string;
}

export function DataFreshness({ updatedAt, dataSource, className = '' }: DataFreshnessProps) {
  const { ti, locale } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const sec = Math.max(0, Math.round((now - updatedAt) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale === 'de' ? 'de' : 'en', { numeric: 'auto' });
  let rel: string;
  if (sec < 60) rel = rtf.format(-sec, 'second');
  else if (sec < 3600) rel = rtf.format(-Math.floor(sec / 60), 'minute');
  else rel = rtf.format(-Math.floor(sec / 3600), 'hour');

  const line = ti('dataFreshLine', { age: rel, source: dataSource ?? '—' });
  return (
    <p className={`text-[10px] text-slate-400 dark:text-white/35 truncate ${className}`} title={line}>
      {line}
    </p>
  );
}
