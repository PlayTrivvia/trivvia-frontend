import { useEffect, useState } from 'react';

/**
 * Detects the virtual keyboard on mobile and resizes the target
 * element to match the visual viewport (the area above the keyboard).
 *
 * Height is applied directly as an inline style for instant response.
 * Ancestor scroll is locked so iOS can't auto-scroll fixed elements.
 */
export function useVisualViewport(targetRef?: React.RefObject<HTMLElement | null>) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const isMobile = window.matchMedia('(max-width: 1024px)').matches;
    if (!isMobile) return;

    // Lock every scrollable ancestor so iOS can't auto-scroll
    // the page when focusing an input inside the fixed game-room.
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // The .app wrapper also has overflow-y:auto — lock it too.
    const appEl = document.querySelector('.app') as HTMLElement | null;
    if (appEl) {
      appEl.style.overflow = 'hidden';
      appEl.style.height = '100%';
    }

    const update = () => {
      const el = targetRef?.current;
      if (!el) return;

      const keyboardHeight = window.innerHeight - vv.height;
      const open = keyboardHeight > 100;

      if (open) {
        // Set BOTH height and bottom to avoid overconstrained layout.
        // CSS has top:0 + bottom:0 — setting only height leaves bottom:0
        // which some browsers resolve incorrectly, clipping the input.
        el.style.height = `${vv.height}px`;
        el.style.bottom = 'auto';
      } else {
        el.style.height = '';
        el.style.bottom = '';
      }

      // Force the browser to recalculate layout immediately
      // so the chat-form is painted in its new position.
      void el.offsetHeight;

      setIsKeyboardOpen(open);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';

      if (appEl) {
        appEl.style.overflow = '';
        appEl.style.height = '';
      }

      const el = targetRef?.current;
      if (el) {
        el.style.height = '';
        el.style.bottom = '';
      }

      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [targetRef]);

  return isKeyboardOpen;
}
