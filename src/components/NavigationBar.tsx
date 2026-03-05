import { useNavigate} from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import './NavigationBar.css';

interface NavigationBarProps {
  currentPage: 'home' | 'rooms' | 'about' | 'login' | 'account' | 'premium';
}

function NavigationBar({ currentPage }: NavigationBarProps) {
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const isLoggedIn = !!auth.token && !!auth.username;

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleRoomsClick = () => {
    navigate('/rooms');
  };

  const handleAboutClick = () => {
    navigate('/about');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleAccountClick = () => {
    navigate('/account');
  };

  const handlePremiumClick = () => {
    navigate('/premium');
  };

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-brand" onClick={handleHomeClick}>
          <div className="logo-circle">
            <span className="logo-text">T</span>
          </div>
          <span className="brand-text">Trivvia</span>
        </div>
        
        <div className="nav-links">
          <button
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={handleHomeClick}
          >
            Home
          </button>
          <button
            className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
            onClick={handleAboutClick}
          >
            About
          </button>
          {!isLoggedIn && (
            <button
              className={`nav-link ${currentPage === 'login' ? 'active' : ''}`}
              onClick={handleLoginClick}
            >
              Login
            </button>
          )}
          <button
            className={`nav-link ${currentPage === 'premium' ? 'active' : ''}`}
            onClick={handlePremiumClick}
          >
            Premium
          </button>
          <button
            className={`nav-categories-btn ${currentPage === 'rooms' ? 'active' : ''}`}
            onClick={handleRoomsClick}
          >
            Categories
          </button>
          {isLoggedIn && (
            <button
              className={`nav-account-btn ${currentPage === 'account' ? 'active' : ''}`}
              onClick={handleAccountClick}
              aria-label="Account"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavigationBar;
