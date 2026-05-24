/** Relative difference above this marks fees as uncertain between two RPC reads. */
export const RPC_DIVERGENCE_RATIO = 0.15;

export function feesAreDivergent(standardA: number, standardB: number): boolean {
  if (!Number.isFinite(standardA) || !Number.isFinite(standardB) || standardA <= 0 || standardB <= 0) {
    return false;
  }
  const rel = Math.abs(standardA - standardB) / Math.max(standardA, standardB);
  return rel > RPC_DIVERGENCE_RATIO;
}
