import { useState, useCallback } from 'react';

const STORAGE_KEY = 'gas-surfer-onboard-v1';

function isComplete(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function useOnboarding() {
  const [open, setOpen] = useState(() => !isComplete());
  /** Bumps when the tour is reopened so the dialog remounts at step 0. */
  const [tourKey, setTourKey] = useState(0);

  const dismissOnboarding = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const reopenOnboarding = useCallback(() => {
    setTourKey((k) => k + 1);
    setOpen(true);
  }, []);

  return { onboardingOpen: open, dismissOnboarding, reopenOnboarding, tourKey };
}
