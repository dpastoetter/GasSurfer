import { dismissForWeek, isDismissedForWeek } from './weekKey';

export const CHEAPEST_CALLOUT_DISMISS_KEY = 'gas-surfer-cheapest-callout-week';

export function isCheapestCalloutDismissed(): boolean {
  return isDismissedForWeek(CHEAPEST_CALLOUT_DISMISS_KEY);
}

export function dismissCheapestCalloutForWeek(): void {
  dismissForWeek(CHEAPEST_CALLOUT_DISMISS_KEY);
}
