/** ISO week id for per-week localStorage dismiss keys (UTC-based). */
export function weekKey(d = new Date()): string {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}

export function isDismissedForWeek(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === weekKey();
  } catch {
    return false;
  }
}

export function dismissForWeek(storageKey: string): void {
  try {
    localStorage.setItem(storageKey, weekKey());
  } catch {
    /* ignore */
  }
}
