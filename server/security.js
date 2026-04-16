/**
 * Security middleware and validation for Gas Surfer API.
 */

/** Chain IDs we accept (Bitcoin + EVM chains from the app). */
export const ALLOWED_CHAIN_IDS = new Set([
  0, 1, 10, 56, 100, 137, 250, 324, 5000, 42161, 42220, 43114, 59144, 8453,
]);

/** Max samples per POST (avoid huge payloads). */
export const MAX_SAMPLES = 20;

/** Max chain IDs per GET /api/averages. */
export const MAX_CHAIN_IDS = 20;

/** Max chains per POST /api/ticks snapshot. */
export const MAX_TICK_CHAINS = 32;

/** Fee value: must be non-negative and below 1e12 (gwei/sat). */
export const VALUE_MIN = 0;
export const VALUE_MAX = 1e12;

/** Timestamp: allow last 25 hours to now + 5 min (clock skew). */
export function isTimestampValid(ts) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  return Number.isFinite(ts) && ts >= now - 25 * hour && ts <= now + 5 * 60 * 1000;
}

/**
 * Validate and normalize a single sample. Returns null if invalid.
 */
export function validateSample(s) {
  if (s == null || typeof s !== 'object') return null;
  const chainId = typeof s.chainId === 'number' ? s.chainId : parseInt(s.chainId, 10);
  const value = typeof s.value === 'number' ? s.value : Number(s.value);
  const timestamp = typeof s.timestamp === 'number' ? s.timestamp : parseInt(s.timestamp, 10);
  if (!Number.isInteger(chainId) || !ALLOWED_CHAIN_IDS.has(chainId)) return null;
  if (!Number.isFinite(value) || value < VALUE_MIN || value > VALUE_MAX) return null;
  if (!isTimestampValid(timestamp)) return null;
  return { chainId, value, timestamp };
}

/**
 * Validate chainIds query: array of integers, all in allowlist, max length.
 */
export function validateChainIds(arr) {
  if (!Array.isArray(arr) || arr.length === 0 || arr.length > MAX_CHAIN_IDS) return null;
  const out = [];
  const seen = new Set();
  for (const id of arr) {
    const n = typeof id === 'number' ? id : parseInt(id, 10);
    if (!Number.isInteger(n) || !ALLOWED_CHAIN_IDS.has(n) || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out.length > 0 ? out : null;
}

const CONDITION_SET = new Set(['surfs-up', 'smooth', 'choppy', 'storm']);

/**
 * Validate optional fee tick snapshot from the app. Returns normalized payload or null.
 */
export function validateTicksPayload(body) {
  if (body == null || typeof body !== 'object') return null;
  const stale = Boolean(body.stale);
  const generatedAt =
    typeof body.generatedAt === 'number' && Number.isFinite(body.generatedAt)
      ? body.generatedAt
      : Date.now();
  const rawChains = Array.isArray(body.chains) ? body.chains : null;
  if (!rawChains || rawChains.length === 0 || rawChains.length > MAX_TICK_CHAINS) return null;
  const chains = [];
  for (const c of rawChains) {
    if (c == null || typeof c !== 'object') return null;
    const chainId = typeof c.chainId === 'number' ? c.chainId : parseInt(c.chainId, 10);
    if (!Number.isInteger(chainId) || !ALLOWED_CHAIN_IDS.has(chainId)) return null;
    const gas = c.gas;
    if (gas == null || typeof gas !== 'object') return null;
    const slow = Number(gas.slow);
    const standard = Number(gas.standard);
    const fast = Number(gas.fast);
    if (![slow, standard, fast].every((n) => Number.isFinite(n) && n >= VALUE_MIN && n <= VALUE_MAX)) return null;
    const name = typeof c.name === 'string' && c.name.length <= 120 ? c.name : 'unknown';
    const symbol = typeof c.symbol === 'string' && c.symbol.length <= 32 ? c.symbol : '';
    const updatedAt =
      typeof c.updatedAt === 'number' && Number.isFinite(c.updatedAt) ? c.updatedAt : generatedAt;
    const condition =
      typeof c.condition === 'string' && CONDITION_SET.has(c.condition) ? c.condition : 'smooth';
    const dataSource =
      c.dataSource == null
        ? null
        : typeof c.dataSource === 'string' && c.dataSource.length <= 200
          ? c.dataSource
          : null;
    let eip1559 = null;
    if (c.eip1559 != null && typeof c.eip1559 === 'object') {
      const b = Number(c.eip1559.baseFeeGwei);
      const p = Number(c.eip1559.priorityFeeGwei);
      if (Number.isFinite(b) && Number.isFinite(p) && b >= 0 && p >= 0 && b <= VALUE_MAX && p <= VALUE_MAX) {
        eip1559 = { baseFeeGwei: b, priorityFeeGwei: p };
      }
    }
    let bitcoinExtras = null;
    if (c.bitcoinExtras != null && typeof c.bitcoinExtras === 'object') {
      const ex = {};
      for (const k of ['economyFee', 'minimumFee', 'fastestFee']) {
        const v = c.bitcoinExtras[k];
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= VALUE_MAX) ex[k] = v;
      }
      if (Object.keys(ex).length > 0) bitcoinExtras = ex;
    }
    let fetchMeta = null;
    if (c.fetchMeta != null && typeof c.fetchMeta === 'object') {
      const attempts = Number(c.fetchMeta.rpcAttempts);
      const host =
        typeof c.fetchMeta.rpcUsedHost === 'string' && c.fetchMeta.rpcUsedHost.length <= 200
          ? c.fetchMeta.rpcUsedHost
          : '';
      if (Number.isInteger(attempts) && attempts >= 1 && attempts <= 50 && host) {
        fetchMeta = { rpcAttempts: attempts, rpcUsedHost: host };
      }
    }
    chains.push({
      chainId,
      name,
      symbol,
      gas: { slow, standard, fast },
      updatedAt,
      condition,
      dataSource,
      fetchMeta,
      eip1559,
      bitcoinExtras,
    });
  }
  return { generatedAt, stale, chains };
}
