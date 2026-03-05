import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import './RoomsPage.css';

interface PremiumUnlockModalProps {
  icon: string;
  name: string;
  description: string;
  onClose: () => void;
}

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

function PremiumUnlockModal({ icon, name, description, onClose }: PremiumUnlockModalProps) {
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    if (!auth.token) {
      navigate('/signup?redirect=premium');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch(`${apiBase}/create_checkout_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">{icon}</div>
          <h2 className="modal-title">{name}</h2>
        </div>
        <div className="modal-body">
          <p className="modal-description">{description}</p>
          <div className="coming-soon-message">
            <span className="coming-soon-text">Premium Only!</span>
            <p className="coming-soon-subtext">Unlock this category and all others for $4.99 / month.</p>
          </div>
          {error && (
            <p style={{ color: '#EF4444', fontSize: 'var(--text-sm)', marginTop: 'var(--spacing-sm)', fontFamily: 'inherit' }}>
              {error}
            </p>
          )}
        </div>
        <div className="modal-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <button className="modal-button" onClick={handleUpgrade} disabled={isProcessing}>
            {isProcessing ? 'Loading…' : 'Upgrade to Premium'}
          </button>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: '#475569', fontFamily: 'inherit', padding: 0 }}
            onClick={onClose}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export default PremiumUnlockModal;
