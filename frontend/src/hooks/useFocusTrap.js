import { useEffect } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(containerRef, active) {
  useEffect(() => {
    if (!active || !containerRef.current) return undefined;

    const root = containerRef.current;
    const previouslyFocused = document.activeElement;

    const getFocusables = () => [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);

    requestAnimationFrame(() => {
      const nodes = getFocusables();
      (nodes[0] || root).focus?.();
    });

    const onKeyDown = (event) => {
      if (event.key === 'Tab') {
        const nodes = getFocusables();
        if (nodes.length === 0) {
          event.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    root.addEventListener('keydown', onKeyDown);
    return () => {
      root.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused?.focus) previouslyFocused.focus();
    };
  }, [active, containerRef]);
}
