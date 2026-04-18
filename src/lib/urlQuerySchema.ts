import { EVM_CHAINS } from '../config/chains';
import { BITCOIN_CHAIN_ID } from '../types';

/** Chain IDs allowed in `compare=` (Bitcoin + configured EVM). */
export const URL_QUERY_CHAIN_IDS = new Set<number>([BITCOIN_CHAIN_ID, ...EVM_CHAINS.map((c) => c.chainId)]);

export type TxPresetUrl = 'erc20' | 'nft' | 'swap';

const TX_PRESET_VALUES: TxPresetUrl[] = ['erc20', 'nft', 'swap'];

/** Gas limits aligned with TxEstimatorPanel presets. */
export const TX_PRESET_GAS_LIMIT: Record<TxPresetUrl, number> = {
  erc20: 65_000,
  nft: 200_000,
  swap: 180_000,
};

/**
 * Parse `compare=1,8453,42161` — max three unique allowlisted chain IDs, order preserved.
 */
export function parseCompareQueryParam(raw: string | null): number[] {
  if (raw == null || raw.trim() === '') return [];
  const out: number[] = [];
  const seen = new Set<number>();
  for (const part of raw.split(',')) {
    const s = part.trim();
    if (s === '') continue;
    const n = parseInt(s, 10);
    if (!Number.isInteger(n) || !URL_QUERY_CHAIN_IDS.has(n) || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= 3) break;
  }
  return out;
}

export function parseTxPresetQueryParam(raw: string | null): TxPresetUrl | null {
  if (raw == null) return null;
  const v = raw.trim().toLowerCase();
  return TX_PRESET_VALUES.includes(v as TxPresetUrl) ? (v as TxPresetUrl) : null;
}
