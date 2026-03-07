const STORAGE_KEY = 'gas-surfer-fee-history';
const MAX_DAYS = 180;
const MS_PER_HOUR = 60 * 60 * 1000;

export interface FeeAverages {
  avg7d: number | null;
  avg30d: number | null;
  avg90d: number | null;
  avg180d: number | null;
}

interface Sample {
  t: number;
  v: number;
}

function getBucketKey(ts: number): number {
  return Math.floor(ts / MS_PER_HOUR) * MS_PER_HOUR;
}

function loadHistory(): Record<number, Sample[]> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<number, Sample[]> = {};
    const cutoff = Date.now() - MAX_DAYS * 24 * MS_PER_HOUR;
    for (const [chainIdStr, arr] of Object.entries(parsed)) {
      if (!Array.isArray(arr)) continue;
      const chainId = parseInt(chainIdStr, 10);
      if (!Number.isFinite(chainId)) continue;
      const filtered = arr
        .filter((s) => s && typeof s.t === 'number' && typeof s.v === 'number' && s.t >= cutoff)
        .sort((a, b) => a.t - b.t);
      const byHour: Record<number, Sample> = {};
      for (const s of filtered) {
        const key = getBucketKey(s.t);
        byHour[key] = { t: s.t, v: s.v };
      }
      out[chainId] = Object.values(byHour).sort((a, b) => a.t - b.t);
    }
    return out;
  } catch {
    return {};
  }
}

function saveHistory(history: Record<number, Sample[]>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const toStore: Record<string, { t: number; v: number }[]> = {};
    for (const [chainId, arr] of Object.entries(history)) {
      toStore[String(chainId)] = arr.slice(-5000);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // ignore
  }
}

export function pushSample(chainId: number, value: number, timestamp: number): void {
  const history = loadHistory();
  if (!history[chainId]) history[chainId] = [];
  const bucket = getBucketKey(timestamp);
  const arr = history[chainId];
  const existing = arr.findIndex((s) => getBucketKey(s.t) === bucket);
  if (existing >= 0) {
    arr[existing] = { t: arr[existing].t, v: value };
  } else {
    arr.push({ t: timestamp, v: value });
    arr.sort((a, b) => a.t - b.t);
  }
  const cutoff = Date.now() - MAX_DAYS * 24 * MS_PER_HOUR;
  history[chainId] = arr.filter((s) => s.t >= cutoff);
  saveHistory(history);
}

export function getAverages(chainId: number): FeeAverages {
  const history = loadHistory();
  const arr = history[chainId];
  if (!arr || arr.length === 0)
    return { avg7d: null, avg30d: null, avg90d: null, avg180d: null };

  const now = Date.now();
  const day = 24 * MS_PER_HOUR;

  const slice = (days: number): number[] => {
    const from = now - days * day;
    return arr.filter((s) => s.t >= from).map((s) => s.v);
  };

  const avg = (vals: number[]) =>
    vals.length === 0 ? null : vals.reduce((a, b) => a + b, 0) / vals.length;

  return {
    avg7d: avg(slice(7)),
    avg30d: avg(slice(30)),
    avg90d: avg(slice(90)),
    avg180d: avg(slice(180)),
  };
}

export function getAllAverages(chainIds: number[]): Record<number, FeeAverages> {
  const history = loadHistory();
  const result: Record<number, FeeAverages> = {};
  for (const chainId of chainIds) {
    const arr = history[chainId];
    if (!arr || arr.length === 0) {
      result[chainId] = { avg7d: null, avg30d: null, avg90d: null, avg180d: null };
      continue;
    }
    result[chainId] = getAverages(chainId);
  }
  return result;
}
