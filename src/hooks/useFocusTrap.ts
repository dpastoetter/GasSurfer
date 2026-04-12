import { useEffect, type RefObject } from 'react';

/** Keep Tab focus inside `containerRef` while `active` (dialogs). */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  /** Bump when inner focusables change (e.g. onboarding step) so focus resets. */
  focusGeneration: number | string = 0
) {
  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el) return;

    const focusables = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [active, containerRef, focusGeneration]);
}
