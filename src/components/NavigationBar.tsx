import { useState } from 'react';
import { useNavigate} from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import './NavigationBar.css';

interface NavigationBarProps {
  currentPage: 'home' | 'rooms' | 'about' | 'login' | 'account' | 'premium' | 'contribute';
}

function NavigationBar({ currentPage }: NavigationBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const isLoggedIn = !!auth.token && !!auth.username;
  const isPremium = isLoggedIn && !!auth.isPremium;

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => handleNavClick('/')}>
          <div className="logo-circle">
            <span className="logo-text">T</span>
          </div>
          <span className="brand-text">Trivvia</span>
        </div>

        <button
          className={`hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <button
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('/')}
          >
            Home
          </button>
          <button
            className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
            onClick={() => handleNavClick('/about')}
          >
            About
          </button>
          {!isLoggedIn && (
            <button
              className={`nav-link ${currentPage === 'login' ? 'active' : ''}`}
              onClick={() => handleNavClick('/login')}
            >
              Login
            </button>
          )}
          <button
            className={`nav-link ${currentPage === 'premium' ? 'active' : ''}`}
            onClick={() => handleNavClick('/premium')}
          >
            Premium
          </button>
          {isPremium && (
            <button
              className={`nav-link ${currentPage === 'contribute' ? 'active' : ''}`}
              onClick={() => handleNavClick('/contribute')}
            >
              Contribute
            </button>
          )}
          <button
            className={`nav-categories-btn ${currentPage === 'rooms' ? 'active' : ''}`}
            onClick={() => handleNavClick('/rooms')}
          >
            Categories
          </button>
          {isLoggedIn && (
            <button
              className={`nav-account-btn ${currentPage === 'account' ? 'active' : ''}`}
              onClick={() => handleNavClick('/account')}
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
      {isMobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </nav>
  );
}

export default NavigationBar;
