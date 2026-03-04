import './InactivityWarningModal.css';

interface InactivityWarningModalProps {
  isOpen: boolean;
  countdown: number;
  onStayActive: () => void;
}

export default function InactivityWarningModal({ isOpen, countdown, onStayActive }: InactivityWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="inactivity-overlay">
      <div className="inactivity-modal">
        <h2 className="inactivity-heading">You've been inactive</h2>
        <p className="inactivity-subtext">Still there?</p>
        <p className="inactivity-countdown">
          Leaving in {countdown} second{countdown !== 1 ? 's' : ''}
        </p>
        <button className="inactivity-button" onClick={onStayActive}>
          I'm here
        </button>
      </div>
    </div>
  );
}
