const STORAGE_KEY = 'gas-surfer-surf-bands-v1';

export type SurfBandOverride = { low: number; mid: number; high: number };

function isValidBand(o: SurfBandOverride): boolean {
  const { low, mid, high } = o;
  if (![low, mid, high].every((n) => Number.isFinite(n) && n > 0)) return false;
  return low <= mid && mid <= high;
}

export function loadSurfBandOverrides(): Record<number, SurfBandOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<number, SurfBandOverride> = {};
    for (const [k, v] of Object.entries(obj)) {
      const id = Number(k);
      if (!Number.isFinite(id)) continue;
      if (!v || typeof v !== 'object') continue;
      const rec = v as Record<string, unknown>;
      const low = Number(rec.low);
      const mid = Number(rec.mid);
      const high = Number(rec.high);
      const band: SurfBandOverride = { low, mid, high };
      if (isValidBand(band)) out[id] = band;
    }
    return out;
  } catch {
    return {};
  }
}

export function setSurfBandOverride(chainId: number, band: SurfBandOverride | null): void {
  try {
    const cur = loadSurfBandOverrides();
    if (band == null) {
      delete cur[chainId];
    } else if (!isValidBand(band)) {
      return;
    } else {
      cur[chainId] = band;
    }
    const flat: Record<string, SurfBandOverride> = {};
    for (const [id, b] of Object.entries(cur)) {
      flat[String(id)] = b;
    }
    if (Object.keys(flat).length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(flat));
  } catch {
    /* ignore */
  }
}

export function clearAllSurfBandOverrides(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
