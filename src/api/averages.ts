/**
 * API client for fee averages (backend database).
 */

import type { FeeAverages } from '../feeHistory';

export async function postSamples(
  samples: { chainId: number; value: number; timestamp: number }[]
): Promise<void> {
  if (samples.length === 0) return;
  const res = await fetch('/api/samples', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ samples }),
  });
  if (!res.ok) throw new Error('Failed to record samples');
}

export async function getAverages(chainIds: number[]): Promise<Record<number, FeeAverages>> {
  if (chainIds.length === 0) return {};
  const q = new URLSearchParams({ chainIds: chainIds.join(',') });
  const res = await fetch(`/api/averages?${q}`);
  if (!res.ok) throw new Error('Failed to fetch averages');
  const data = (await res.json()) as Record<number, FeeAverages>;
  return data;
}
