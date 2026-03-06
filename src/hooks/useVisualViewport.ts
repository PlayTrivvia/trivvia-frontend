import { useEffect, useState } from 'react';

/**
 * Tracks the visual viewport height to handle virtual keyboard on mobile.
 * Sets a --vh CSS custom property on the target element so CSS can use
 * `calc(var(--vh, 1vh) * 100)` instead of `100vh` for accurate height
 * when the keyboard is open.
 *
 * Returns whether the keyboard is currently open.
 */
export function useVisualViewport(targetRef?: React.RefObject<HTMLElement | null>) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const KEYBOARD_THRESHOLD = 100; // px difference to consider keyboard open

    const update = () => {
      const fullHeight = window.innerHeight;
      const viewportHeight = vv.height;
      const keyboardOpen = fullHeight - viewportHeight > KEYBOARD_THRESHOLD;

      setIsKeyboardOpen(keyboardOpen);

      // Set --vh on the target element (or documentElement as fallback)
      const el = targetRef?.current ?? document.documentElement;
      el.style.setProperty('--vh', `${viewportHeight * 0.01}px`);
    };

    update();
    vv.addEventListener('resize', update);
    return () => vv.removeEventListener('resize', update);
  }, [targetRef]);

  return isKeyboardOpen;
}
