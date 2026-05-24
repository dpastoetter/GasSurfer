import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CHEAPEST_CALLOUT_DISMISS_KEY,
  dismissCheapestCalloutForWeek,
  isCheapestCalloutDismissed,
} from './cheapestCalloutDismiss';
import { weekKey } from './weekKey';

describe('cheapestCalloutDismiss', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: () => null,
      length: 0,
    } as Storage);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('is not dismissed initially', () => {
    expect(isCheapestCalloutDismissed()).toBe(false);
  });

  it('dismisses for the current week only', () => {
    dismissCheapestCalloutForWeek();
    expect(isCheapestCalloutDismissed()).toBe(true);
    expect(localStorage.getItem(CHEAPEST_CALLOUT_DISMISS_KEY)).toBe(weekKey());
  });
});
