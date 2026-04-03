import { useState, useEffect, useCallback } from 'react';
import type { ChainGas } from '../types';
import { formatGwei, feeUnitLabel } from '../types';
import { useI18n } from '../i18n/I18nContext';

const STORAGE_PREFIX = 'gas-surfer-alert-below-';
const LAST_NOTIFY_PREFIX = 'gas-surfer-alert-last-';
const COOLDOWN_MS = 5 * 60 * 1000;

function loadThreshold(chainId: number): string {
  try {
    return localStorage.getItem(STORAGE_PREFIX + chainId) ?? '';
  } catch {
    return '';
  }
}

function saveThreshold(chainId: number, value: string) {
  try {
    if (value === '') localStorage.removeItem(STORAGE_PREFIX + chainId);
    else localStorage.setItem(STORAGE_PREFIX + chainId, value);
  } catch {
    /* ignore */
  }
}

function initialNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof globalThis.Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

interface FeeAlertsPanelProps {
  chain: ChainGas | undefined;
}

function FeeAlertsPanelInner({ chain }: { chain: ChainGas }) {
  const { t, ti } = useI18n();
  const [threshold, setThreshold] = useState(() => loadThreshold(chain.chainId));
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(initialNotificationPermission);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setPerm(p);
  }, []);

  useEffect(() => {
    if (perm !== 'granted') return;
    const raw = loadThreshold(chain.chainId);
    const max = parseFloat(raw);
    if (!Number.isFinite(max) || max <= 0) return;
    if (chain.gas.standard > max) return;
    const key = LAST_NOTIFY_PREFIX + chain.chainId;
    let last = 0;
    try {
      last = parseInt(sessionStorage.getItem(key) ?? '0', 10) || 0;
    } catch {
      /* ignore */
    }
    if (Date.now() - last < COOLDOWN_MS) return;
    try {
      sessionStorage.setItem(key, String(Date.now()));
      new Notification(t('alertsNotifyTitle'), {
        body: ti('alertsNotifyBody', {
          name: chain.name,
          fee: formatGwei(chain.gas.standard),
          unit: feeUnitLabel(chain.chainId),
          threshold: raw,
        }),
      });
    } catch {
      /* ignore */
    }
  }, [chain, perm, t, ti]);

  const save = () => {
    saveThreshold(chain.chainId, threshold.trim());
  };

  const clear = () => {
    setThreshold('');
    saveThreshold(chain.chainId, '');
  };

  return (
    <div className="rounded-2xl glass border border-slate-200/50 dark:border-white/10 p-4 mb-6 text-sm">
      <h3 className="font-display text-lg tracking-wide text-slate-800 dark:text-white mb-2">{t('alertsTitle')}</h3>
      <p className="text-slate-500 dark:text-white/50 text-xs mb-3">{t('alertsPrivacy')}</p>
      {perm === 'unsupported' ? null : perm !== 'granted' ? (
        <button
          type="button"
          onClick={requestPermission}
          className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2 text-slate-700 dark:text-surf-200 mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
        >
          {t('alertsEnable')}
        </button>
      ) : (
        <p className="text-emerald-600 dark:text-emerald-400 text-xs mb-2">{t('alertsGranted')}</p>
      )}
      {perm === 'denied' && <p className="text-amber-600 dark:text-amber-300 text-xs mb-2">{t('alertsDenied')}</p>}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-slate-600 dark:text-surf-300 text-xs">
            {t('alertsThreshold')} ({feeUnitLabel(chain.chainId)})
          </span>
          <input
            type="number"
            step="any"
            min="0"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-32 rounded-lg border border-slate-300/50 dark:border-white/20 bg-white/80 dark:bg-surf-900/40 px-2 py-1.5 text-slate-800 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
            placeholder="0"
          />
        </label>
        <button
          type="button"
          onClick={save}
          className="rounded-xl glass border border-slate-300/50 dark:border-white/20 px-3 py-2 text-slate-700 dark:text-surf-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
        >
          {t('alertsSave')}
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-xl px-3 py-2 text-slate-500 dark:text-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-surf-400/50"
        >
          {t('alertsClear')}
        </button>
      </div>
    </div>
  );
}

export function FeeAlertsPanel({ chain }: FeeAlertsPanelProps) {
  if (!chain) return null;
  return <FeeAlertsPanelInner key={chain.chainId} chain={chain} />;
}
