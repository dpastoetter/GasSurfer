import { useState, useEffect } from 'react';
import { loadTicksSince } from '../lib/feeSamplesDb';
import { computeTideTable } from '../lib/tideTable';
import { ETHEREUM_CHAIN_ID } from '../types';

/** True when current UTC hour is among top calm hours for Ethereum (device tide). */
export function useCalmHourNow(chainId: number | undefined): boolean {
  const [calm, setCalm] = useState(false);

  useEffect(() => {
    if (chainId !== ETHEREUM_CHAIN_ID) return;
    let cancelled = false;
    const since = Date.now() - 7 * 86400_000;
    void loadTicksSince(since).then((rows) => {
      if (cancelled) return;
      const tide = computeTideTable(rows);
      if (!tide || tide.topCalmHours.length === 0) {
        setCalm(false);
        return;
      }
      const hour = new Date().getUTCHours();
      setCalm(tide.topCalmHours.includes(hour));
    });
    return () => {
      cancelled = true;
    };
  }, [chainId]);

  return chainId === ETHEREUM_CHAIN_ID && calm;
}
