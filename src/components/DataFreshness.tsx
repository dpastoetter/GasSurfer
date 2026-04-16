import { useState, useEffect } from 'react';
import type { RpcFetchMeta } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface DataFreshnessProps {
  updatedAt: number;
  dataSource?: string;
  fetchMeta?: RpcFetchMeta;
  className?: string;
}

export function DataFreshness({ updatedAt, dataSource, fetchMeta, className = '' }: DataFreshnessProps) {
  const { ti, locale } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const sec = Math.max(0, Math.round((now - updatedAt) / 1000));
  const rtfLocale = locale === 'de' ? 'de' : locale === 'es' ? 'es' : 'en';
  const rtf = new Intl.RelativeTimeFormat(rtfLocale, { numeric: 'auto' });
  let rel: string;
  if (sec < 60) rel = rtf.format(-sec, 'second');
  else if (sec < 3600) rel = rtf.format(-Math.floor(sec / 60), 'minute');
  else rel = rtf.format(-Math.floor(sec / 3600), 'hour');

  const line = ti('dataFreshLine', { age: rel, source: dataSource ?? '—' });
  const rpcHint =
    fetchMeta && fetchMeta.rpcAttempts > 1
      ? ti('rpcDetailLine', { n: fetchMeta.rpcAttempts, host: fetchMeta.rpcUsedHost })
      : '';
  const title = rpcHint ? `${line} · ${rpcHint}` : line;
  return (
    <div className={className}>
      <p className="text-[10px] text-slate-400 dark:text-white/35 truncate" title={title}>
        {line}
      </p>
      {fetchMeta && fetchMeta.rpcAttempts > 1 && (
        <p className="text-[9px] text-slate-400/90 dark:text-white/30 truncate" title={rpcHint}>
          {ti('rpcMetaShort', { host: fetchMeta.rpcUsedHost, n: fetchMeta.rpcAttempts })}
        </p>
      )}
    </div>
  );
}
