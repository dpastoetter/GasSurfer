import { useState, useEffect } from 'react';
import { loadTicksSince } from '../lib/feeSamplesDb';
import { TIDE_MIN_SAMPLES } from '../lib/tideTable';

const NUDGE_STORAGE_KEY = 'gas-surfer-recap-nudge-week';

function weekKey(d = new Date()): string {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}

function isDismissedThisWeek(): boolean {
  try {
    return localStorage.getItem(NUDGE_STORAGE_KEY) === weekKey();
  } catch {
    return false;
  }
}

export function dismissRecapNudgeForWeek(): void {
  try {
    localStorage.setItem(NUDGE_STORAGE_KEY, weekKey());
  } catch {
    /* ignore */
  }
}

/** Show dot on weekly recap when enough local samples exist and user has not dismissed this week. */
export function useRecapNudge(): boolean {
  const [sampleReady, setSampleReady] = useState(false);

  useEffect(() => {
    if (isDismissedThisWeek()) return;
    const since = Date.now() - 7 * 86400_000;
    void loadTicksSince(since).then((rows) => {
      const ok = rows.filter((r) => !r.stale).length;
      setSampleReady(ok >= TIDE_MIN_SAMPLES);
    });
  }, []);

  return sampleReady && !isDismissedThisWeek();
}
