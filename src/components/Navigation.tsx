import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

interface NavigationProps {
  isGameLoading?: boolean;
}

function Navigation({ isGameLoading = false }: NavigationProps) {
  const location = useLocation();
  
  // Don't show navigation on the home page or during game loading
  if (location.pathname === '/' || (location.pathname === '/game' && isGameLoading)) {
    return null;
  }
  
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="nav-logo">
            <img src="/trivvia-logo.png" alt="Trivvia" className="nav-logo-img" />
            <span className="nav-logo-text">Trivvia</span>
          </Link>
        </div>
        
        <div className="nav-links">
          <Link 
            to="/" 
            className="nav-link"
          >
            Home
          </Link>
          {location.pathname === '/game' && (
            <span className="nav-current">Game Room</span>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
