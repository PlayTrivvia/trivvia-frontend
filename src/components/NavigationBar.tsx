import { useNavigate} from 'react-router-dom';
import './NavigationBar.css';

interface NavigationBarProps {
  currentPage: 'home' | 'about';
}

function NavigationBar({ currentPage }: NavigationBarProps) {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/');
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
