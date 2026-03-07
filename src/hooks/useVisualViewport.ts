import { useEffect, useRef, useState } from 'react';

/**
 * Tracks the visual viewport height to handle virtual keyboard on mobile.
 * Sets a --vh CSS custom property on the target element so CSS can use
 * `calc(var(--vh, 1vh) * 100)` instead of `100vh` for accurate height
 * when the keyboard is open.
 *
 * Uses requestAnimationFrame for smooth, jank-free updates that sync
 * with the keyboard's own slide animation.
 *
 * Returns whether the keyboard is currently open.
 */
export function useVisualViewport(targetRef?: React.RefObject<HTMLElement | null>) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const KEYBOARD_THRESHOLD = 100; // px difference to consider keyboard open

    const update = () => {
      // Cancel any pending frame to avoid stacking
      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        const fullHeight = window.innerHeight;
        const viewportHeight = vv.height;
        const keyboardOpen = fullHeight - viewportHeight > KEYBOARD_THRESHOLD;

        setIsKeyboardOpen(keyboardOpen);

        // Set --vh on the target element (or documentElement as fallback)
        const el = targetRef?.current ?? document.documentElement;
        el.style.setProperty('--vh', `${viewportHeight * 0.01}px`);
      });
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [targetRef]);

  return isKeyboardOpen;
}
