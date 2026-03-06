import { useEffect, useRef } from 'react';
import './HintDisplay.css';

interface HintDisplayProps {
  hint: string;
  done: boolean;
  countdown?: number;
}

export default function HintDisplay({ hint, done, countdown = 0 }: HintDisplayProps) {
  const hintRef = useRef<HTMLDivElement>(null);
  const lastHintRef = useRef<string>('');

  useEffect(() => {

    if (!hintRef.current || hint === lastHintRef.current) {
      return;
    }

    // Only update if we have a new hint
    if (hint !== lastHintRef.current) {
      lastHintRef.current = hint;

      // Progressive letter reveal - add new letters without re-rendering
      if (hintRef.current) {
        hintRef.current.textContent = hint;

        // Add a subtle animation for new letters
        hintRef.current.style.animation = 'none';
        hintRef.current.offsetHeight; // Trigger reflow
        hintRef.current.style.animation = 'hintReveal 0.3s ease-out';
      }
    }
  }, [hint, done]);

  // Before any letters have been revealed, show only the countdown
  if (countdown > 0 && (!hint || hint.trim() === '')) {
    return (
      <div className="hint-display">
        <span className="hint-label">💡 Hint:</span>
        <span className="hint-countdown">Coming up in {countdown}s</span>
      </div>
    );
  }

  if (!hint || hint.trim() === '') {
    return null;
  }

  return (
    <div className="hint-display">
      <span className="hint-label">💡 Hint:</span>
      <span
        ref={hintRef}
        className="hint-text"
        data-hint={hint}
        data-done={done}
      >
        {hint}
      </span>
      {countdown > 0 && <span className="hint-countdown"> — next letter in {countdown}s</span>}
      {done && <span className="hint-complete">✨</span>}
    </div>
  );
}
