import type { SurfCondition } from '../types';
import { BITCOIN_CHAIN_ID } from '../types';
import type { SurfBandOverride } from './surfBandsStorage';

function defaultBands(chainId: number): { low: number; mid: number; high: number } {
  if (chainId === BITCOIN_CHAIN_ID) {
    return { low: 5, mid: 15, high: 50 };
  }
  const isL2 = ![1, 137, 56, 43114, 250, 100, 42220].includes(chainId);
  const low = isL2 ? 0.05 : chainId === 56 ? 3 : chainId === 137 ? 30 : chainId === 43114 ? 25 : chainId === 250 ? 1 : chainId === 100 ? 1 : 20;
  const mid = isL2 ? 0.2 : chainId === 56 ? 5 : chainId === 137 ? 50 : chainId === 43114 ? 50 : chainId === 250 ? 5 : chainId === 100 ? 2 : 50;
  const high = isL2 ? 0.5 : chainId === 56 ? 10 : chainId === 137 ? 80 : chainId === 43114 ? 100 : chainId === 250 ? 10 : chainId === 100 ? 5 : 80;
  return { low, mid, high };
}

/**
 * Map standard fee to surf condition. Optional per-chain overrides replace default low/mid/high thresholds (same units as display: gwei or sat/vB).
 */
export function getSurfCondition(
  standardFee: number,
  chainId: number,
  override?: SurfBandOverride | null
): SurfCondition {
  const { low, mid, high } =
    override && override.low > 0 && override.mid > 0 && override.high > 0 && override.low <= override.mid && override.mid <= override.high
      ? override
      : defaultBands(chainId);
  if (standardFee <= low) return 'surfs-up';
  if (standardFee <= mid) return 'smooth';
  if (standardFee <= high) return 'choppy';
  return 'storm';
}
