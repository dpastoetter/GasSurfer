import { useEffect, useRef } from 'react';
import type { ChainGas, SurfCondition } from '../types';
import { loadWebhookRegime, maybeFireWebhookAlerts } from '../lib/webhookAlerts';

const THRESHOLD_PREFIX = 'gas-surfer-alert-below-';

function loadThreshold(chainId: number): string {
  try {
    return localStorage.getItem(THRESHOLD_PREFIX + chainId) ?? '';
  } catch {
    return '';
  }
}

/** Fire user-configured webhooks when fee rules match (tab may be in background). */
export function useWebhookAlerts(chain: ChainGas | undefined): void {
  const prevConditionRef = useRef<SurfCondition | null>(null);

  useEffect(() => {
    if (!chain) return;
    const prev = prevConditionRef.current;
    prevConditionRef.current = chain.condition;
    void maybeFireWebhookAlerts({
      chain,
      prevCondition: prev,
      thresholdBelow: loadThreshold(chain.chainId),
      regime: loadWebhookRegime(chain.chainId),
    });
  }, [chain]);
}
