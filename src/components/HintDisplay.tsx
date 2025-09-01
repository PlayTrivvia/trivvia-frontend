import { useEffect, useRef } from 'react';
import './HintDisplay.css';

interface HintDisplayProps {
  hint: string;
  done: boolean;
}

export default function HintDisplay({ hint, done }: HintDisplayProps) {
  const hintRef = useRef<HTMLDivElement>(null);
  const lastHintRef = useRef<string>('');

  useEffect(() => {
    console.log('💡 HintDisplay effect:', { hint, done, lastHint: lastHintRef.current });
    
    if (!hintRef.current || hint === lastHintRef.current) {
      return;
    }

    // Only update if we have a new hint
    if (hint !== lastHintRef.current) {
      console.log('💡 Updating hint display:', { from: lastHintRef.current, to: hint });
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
      {done && <span className="hint-complete">✨</span>}
    </div>
  );
}
