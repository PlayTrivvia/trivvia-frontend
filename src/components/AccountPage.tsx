import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout, setSubscriptionCancelled, setPremiumStatus } from '../store/authSlice';
import NavigationBar from './NavigationBar';
import './AccountPage.css';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

const ROOM_ORDER = ['general', 'science', 'math', 'pop-culture', 'history', 'sports', 'geography', 'literature'];

function AccountPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const sessionId = useAppSelector((state) => state.username.sessionId);
  interface RoomStreak {
    room_slug: string;
    name: string;
    emoji: string;
    best_streak: number;
  }
  const [roomStreaks, setRoomStreaks] = useState<RoomStreak[] | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    if (!auth.token) return;
    const url = new URL(`${apiBase}/user_info`);
    if (sessionId) url.searchParams.set('session_id', sessionId);
    fetch(url.toString(), {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        dispatch(setPremiumStatus({
          isPremium: Boolean(data.is_premium),
          premiumExpiresAt: data.premium_expires_at ? String(data.premium_expires_at) : null,
        }));
      })
      .catch(() => {});
  }, [auth.token, sessionId]);

  useEffect(() => {
    if (!auth.token) return;
    fetch(`${apiBase}/user_room_streaks`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((r) => r.json())
      .then((data) => setRoomStreaks(data.room_streaks ?? []))
      .catch(() => setRoomStreaks([]));
  }, [auth.token]);

  // Redirect if not logged in
  if (!auth.token || !auth.username) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleUpgradeToPremium = () => {
    navigate('/premium');
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    setCancelError('');
    try {
      const response = await fetch(`${apiBase}/cancel_subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      dispatch(setSubscriptionCancelled());
      setShowCancelModal(false);
      setCancelSuccess(true);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatExpiry = () => {
    if (!auth.premiumExpiresAt) return 'the end of your billing period';
    return new Date(auth.premiumExpiresAt).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  const isCancelled = auth.subscriptionCancelled || cancelSuccess;

  return (
    <div className="account-page">
      <NavigationBar currentPage="account" />
      <div className="account-container">
        <div className="account-content">
          <h1 className="account-title animate-fade-in">Your Account</h1>
          <p className="account-subtitle animate-fade-in-delay-1">Manage your Trivvia profile</p>

          {/* Premium active banner */}
          {auth.isPremium && (
            <div className="premium-active-banner animate-fade-in-delay-2">
              <div className="premium-active-content">
                <span className="premium-active-icon">👑</span>
                <div className="premium-active-text">
                  <h3 className="premium-active-title">Premium Member</h3>
                  <p className="premium-active-description">
                    {isCancelled
                      ? `Access until ${formatExpiry()}. You'll return to free after that.`
                      : 'You have full access to all trivia categories.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade banner for free users */}
          {!auth.isPremium && (
            <div className="premium-banner animate-fade-in-delay-2">
              <div className="premium-banner-content">
                <div className="premium-badge-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="premium-banner-text">
                  <h3 className="premium-banner-title">Upgrade to Premium</h3>
                  <p className="premium-banner-description">
                    Unlock custom themes, premium badge, and support Trivvia for just $4.99/month
                  </p>
                </div>
                <button className="premium-banner-button" onClick={handleUpgradeToPremium}>
                  Learn More →
                </button>
              </div>
            </div>
          )}

          <div className="account-card animate-fade-in-delay-3">
            <div className="account-section">
              <h3 className="section-title">Profile Information</h3>

              <div className="info-row">
                <span className="info-label">Username:</span>
                <span className="info-value">
                  {auth.username?.toLowerCase()}
                  {auth.isPremium && <span className="username-crown">👑</span>}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{auth.email}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Account Type:</span>
                <span className={`info-value ${auth.isPremium ? 'premium-status' : ''}`}>
                  {auth.isPremium ? '⭐ Premium Member' : 'Free'}
                </span>
              </div>

            </div>

            <div className="account-section">
              <h3 className="section-title">Best Streaks by Room</h3>
              {roomStreaks === null ? (
                <div className="info-row">
                  <span className="info-value">...</span>
                </div>
              ) : roomStreaks.length === 0 ? (
                <div className="info-row">
                  <span className="info-value">🔥 Start playing to build a streak</span>
                </div>
              ) : (
                [...roomStreaks].sort((a, b) => {
                const ai = ROOM_ORDER.indexOf(a.room_slug);
                const bi = ROOM_ORDER.indexOf(b.room_slug);
                return (ai === -1 ? ROOM_ORDER.length : ai) - (bi === -1 ? ROOM_ORDER.length : bi);
              }).map((rs) => (
                  <div className="info-row" key={rs.room_slug}>
                    <span className="info-label">{rs.emoji} {rs.name}:</span>
                    <span className="info-value">🔥 {rs.best_streak}</span>
                  </div>
                ))
              )}
            </div>

            {/* Subscription management — only for premium users */}
            {auth.isPremium && (
              <div className="account-section subscription-section">
                <h3 className="section-title">Subscription</h3>

                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className={`info-value ${isCancelled ? 'cancel-scheduled-status' : 'premium-status'}`}>
                    {isCancelled ? '⚠ Cancellation Scheduled' : '✓ Active'}
                  </span>
                </div>

                {auth.premiumExpiresAt && (
                  <div className="info-row">
                    <span className="info-label">
                      {isCancelled ? 'Access until:' : 'Next billing:'}
                    </span>
                    <span className="info-value">{formatExpiry()}</span>
                  </div>
                )}

                {!isCancelled && (
                  <div className="subscription-actions">
                    <button
                      className="cancel-sub-btn"
                      onClick={() => setShowCancelModal(true)}
                    >
                      Cancel Subscription
                    </button>
                  </div>
                )}

                {isCancelled && (
                  <p className="cancel-scheduled-notice">
                    Your subscription has been cancelled. Premium access continues until {formatExpiry()}.
                  </p>
                )}
              </div>
            )}

            <div className="account-actions">
              <button className="logout-button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="account-modal-overlay" onClick={() => !isCancelling && setShowCancelModal(false)}>
          <div className="account-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="account-modal-header">
              <div className="account-modal-icon">😢</div>
              <h2 className="account-modal-title">Cancel Subscription?</h2>
            </div>
            <div className="account-modal-body">
              <p className="account-modal-description">
                Your Premium access will continue until <strong>{formatExpiry()}</strong>. After that, you'll return to the free plan.
              </p>
              {cancelError && (
                <p className="cancel-modal-error">{cancelError}</p>
              )}
            </div>
            <div className="account-modal-footer">
              <button
                className="account-modal-btn-keep"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep Premium
              </button>
              <button
                className="account-modal-btn-cancel"
                onClick={handleCancelSubscription}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountPage;
