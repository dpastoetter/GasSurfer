import { useState, useEffect } from 'react';
import { loadTicksSince } from '../lib/feeSamplesDb';
import { TIDE_MIN_SAMPLES } from '../lib/tideTable';
import { dismissForWeek, isDismissedForWeek } from '../lib/weekKey';

const NUDGE_STORAGE_KEY = 'gas-surfer-recap-nudge-week';

export function dismissRecapNudgeForWeek(): void {
  dismissForWeek(NUDGE_STORAGE_KEY);
}

/** Show dot on weekly recap when enough local samples exist and user has not dismissed this week. */
export function useRecapNudge(): boolean {
  const [sampleReady, setSampleReady] = useState(false);

  useEffect(() => {
    if (isDismissedForWeek(NUDGE_STORAGE_KEY)) return;
    const since = Date.now() - 7 * 86400_000;
    void loadTicksSince(since).then((rows) => {
      const ok = rows.filter((r) => !r.stale).length;
      setSampleReady(ok >= TIDE_MIN_SAMPLES);
    });
  }, []);

  return sampleReady && !isDismissedForWeek(NUDGE_STORAGE_KEY);
}
