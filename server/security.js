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
