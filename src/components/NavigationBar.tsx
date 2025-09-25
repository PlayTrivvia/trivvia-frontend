import { useNavigate} from 'react-router-dom';
import './NavigationBar.css';

interface NavigationBarProps {
  currentPage: 'home' | 'rooms' | 'about';
}

function NavigationBar({ currentPage }: NavigationBarProps) {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleRoomsClick = () => {
    navigate('/rooms');
  };

  const handleAboutClick = () => {
    navigate('/about');
  };

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-brand">
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
            className={`nav-link ${currentPage === 'rooms' ? 'active' : ''}`}
            onClick={handleRoomsClick}
          >
            Categories
          </button>
          <button
            className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
            onClick={handleAboutClick}
          >
            About
          </button>
        </div>
      </div>
    </nav>
  );
}

export default NavigationBar;
