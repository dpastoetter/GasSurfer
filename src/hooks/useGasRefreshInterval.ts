import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'gas-surfer-refresh-ms';

export type RefreshIntervalChoice = 6000 | 12000 | 30000 | 0;

const DEFAULT_MS: RefreshIntervalChoice = 12000;

function loadMs(): RefreshIntervalChoice {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    const n = s != null ? parseInt(s, 10) : NaN;
    if (n === 6000 || n === 12000 || n === 30000 || n === 0) return n;
  } catch {
    /* ignore */
  }
  return DEFAULT_MS;
}

export function useGasRefreshInterval() {
  const [refreshIntervalMs, setRefreshIntervalMsState] = useState<RefreshIntervalChoice>(loadMs);

  const setRefreshIntervalMs = useCallback((ms: RefreshIntervalChoice) => {
    setRefreshIntervalMsState(ms);
    try {
      localStorage.setItem(STORAGE_KEY, String(ms));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue != null) {
        const n = parseInt(e.newValue, 10);
        if (n === 6000 || n === 12000 || n === 30000 || n === 0) setRefreshIntervalMsState(n);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { refreshIntervalMs, setRefreshIntervalMs };
}
