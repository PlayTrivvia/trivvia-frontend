import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';
import NavigationBar from './NavigationBar';
import './AccountPage.css';

function AccountPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

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

  return (
    <div className="account-page">
      <NavigationBar currentPage="account" />
      <div className="account-container">
        <div className="account-content">
          <h1 className="account-title animate-fade-in">Your Account</h1>
          <p className="account-subtitle animate-fade-in-delay-1">Manage your Trivvia profile</p>

          {/* Premium Upgrade Banner */}
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
                <span className="info-value">{auth.username?.toLowerCase()}</span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{auth.email}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Account Type:</span>
                <span className={`info-value ${auth.isPremium ? 'premium-status' : ''}`}>
                  {auth.isPremium ? (
                    <>⭐ Premium Member</>
                  ) : (
                    'Free'
                  )}
                </span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Best Streak:</span>
                <span className="info-value">🔥 Coming soon</span>
              </div>
            </div>

            <div className="account-actions">
              <button className="logout-button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;

