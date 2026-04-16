import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChainGas, SurfCondition } from '../types';
import { formatGwei, feeUnitLabel } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { conditionLabels } from '../i18n/messages';

const STORAGE_PREFIX = 'gas-surfer-alert-below-';
const LAST_NOTIFY_PREFIX = 'gas-surfer-alert-last-';
const REGIME_PREFIX = 'gas-surfer-alert-regime-';
const REGIME_COOL_PREFIX = 'gas-surfer-alert-regime-cool-';
const COOLDOWN_MS = 5 * 60 * 1000;
const REGIME_COOLDOWN_MS = 30 * 60 * 1000;

const CONDITION_RANK: Record<SurfCondition, number> = {
  'surfs-up': 0,
  smooth: 1,
  choppy: 2,
  storm: 3,
};

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

type RegimePrefs = { improve: boolean; worsen: boolean };

function loadRegime(chainId: number): RegimePrefs {
  try {
    const raw = localStorage.getItem(REGIME_PREFIX + chainId);
    if (!raw) return { improve: false, worsen: false };
    const p = JSON.parse(raw) as RegimePrefs;
    return {
      improve: Boolean(p.improve),
      worsen: Boolean(p.worsen),
    };
  } catch {
    return { improve: false, worsen: false };
  }
}

function saveRegime(chainId: number, prefs: RegimePrefs) {
  try {
    localStorage.setItem(REGIME_PREFIX + chainId, JSON.stringify(prefs));
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
  const { t, ti, locale } = useI18n();
  const labels = conditionLabels(locale);
  const [threshold, setThreshold] = useState(() => loadThreshold(chain.chainId));
  const [regime, setRegime] = useState(() => loadRegime(chain.chainId));
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(initialNotificationPermission);
  const prevConditionRef = useRef<SurfCondition | null>(null);

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
  }, [chain.chainId, chain.name, chain.gas.standard, perm, t, ti]);

  useEffect(() => {
    if (perm !== 'granted') return;
    const prev = prevConditionRef.current;
    prevConditionRef.current = chain.condition;
    if (prev == null) return;
    if (prev === chain.condition) return;

    const rp = loadRegime(chain.chainId);
    const rPrev = CONDITION_RANK[prev];
    const rNext = CONDITION_RANK[chain.condition];
    const improved = rNext < rPrev;
    const worsened = rNext > rPrev;
    if (improved && !rp.improve) return;
    if (worsened && !rp.worsen) return;
    if (!improved && !worsened) return;

    const dir = improved ? 'up' : 'down';
    const coolKey = REGIME_COOL_PREFIX + chain.chainId + '-' + dir;
    let last = 0;
    try {
      last = parseInt(sessionStorage.getItem(coolKey) ?? '0', 10) || 0;
    } catch {
      /* ignore */
    }
    if (Date.now() - last < REGIME_COOLDOWN_MS) return;

    try {
      sessionStorage.setItem(coolKey, String(Date.now()));
      new Notification(t('alertsNotifyTitle'), {
        body: ti('alertsNotifyRegimeBody', {
          name: chain.name,
          fromLabel: labels[prev].label,
          toLabel: labels[chain.condition].label,
          fee: formatGwei(chain.gas.standard),
          unit: feeUnitLabel(chain.chainId),
        }),
      });
    } catch {
      /* ignore */
    }
  }, [chain.chainId, chain.condition, chain.name, chain.gas.standard, perm, t, ti, labels]);

  const save = () => {
    saveThreshold(chain.chainId, threshold.trim());
  };

  const clear = () => {
    setThreshold('');
    saveThreshold(chain.chainId, '');
  };

  const toggleRegime = (key: keyof RegimePrefs) => {
    const next = { ...regime, [key]: !regime[key] };
    setRegime(next);
    saveRegime(chain.chainId, next);
  };

  return (
    <div className="rounded-2xl glass border border-slate-200/50 dark:border-white/10 p-4 mb-6 text-sm">
      <h2 className="font-display text-lg tracking-wide text-slate-800 dark:text-white mb-2">{t('alertsTitle')}</h2>
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
      <fieldset className="mb-4 space-y-2 border border-slate-200/40 dark:border-white/10 rounded-xl p-3">
        <legend className="text-xs font-medium text-slate-600 dark:text-surf-300 px-1">{t('alertsRegimeLegend')}</legend>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={regime.improve}
            onChange={() => toggleRegime('improve')}
            className="rounded border-slate-400 text-surf-600 focus:ring-surf-400/50"
          />
          <span className="text-slate-700 dark:text-surf-200 text-xs">{t('alertsRegimeImprove')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={regime.worsen}
            onChange={() => toggleRegime('worsen')}
            className="rounded border-slate-400 text-surf-600 focus:ring-surf-400/50"
          />
          <span className="text-slate-700 dark:text-surf-200 text-xs">{t('alertsRegimeWorsen')}</span>
        </label>
      </fieldset>
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
