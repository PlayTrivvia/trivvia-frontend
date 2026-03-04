import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { generateUsername, createSessionWithUsername } from '../store/usernameSlice';
import NavigationBar from './NavigationBar'
import './IntroPage.css'

interface IntroPageProps {
  onSelectCategory: () => void;
}

function IntroPage({ onSelectCategory }: IntroPageProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const isLoggedIn = !!auth.token && !!auth.username;

  const handleStartGame = async () => {
    try {
      // If logged in, create session with their username; otherwise generate random one
      if (isLoggedIn && auth.username) {
        await dispatch(createSessionWithUsername({ username: auth.username, token: auth.token! })).unwrap();
      } else {
        await dispatch(generateUsername()).unwrap();
      }
      navigate('/game?category=general');
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  return (
    <div className="intro-page">
      <NavigationBar currentPage="home" />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title animate-fade-in">Play Trivvia live with others.</h1>
          <div className="hero-description">
            <p className="animate-fade-in-delay-1">Jump in anytime, practice your trivia chops, and compete for the leaderboard.</p>
          </div>
          <div className="hero-actions animate-fade-in-delay-2">
            <button
              onClick={handleStartGame}
              className="hero-primary-btn"
            >
              Start a game →
            </button>
            <a href="#" onClick={(e) => { e.preventDefault(); onSelectCategory(); }} className="hero-secondary-link">
              Browse categories
            </a>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="how-it-works">
        <div className="how-it-works-content">
          <h2 className="section-heading animate-fade-in-view">How it works</h2>
          <div className="feature-cards">
          <div className="feature-card animate-fade-in-view-delay-1">
            <div className="card-icon-wrapper">
              <svg className="card-icon hand-drawn" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" x2="10" y1="11" y2="11"/>
                <line x1="8" x2="8" y1="9" y2="13"/>
                <line x1="15" x2="15.01" y1="12" y2="12"/>
                <line x1="18" x2="18.01" y1="10" y2="10"/>
                <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>
              </svg>
            </div>
            <div className="feature-card-content">
              <h3 className="card-title">Jump in as a guest</h3>
              <p className="card-text">Everyone can play instantly, no sign-up required.</p>
            </div>
          </div>
          <div className="feature-card animate-fade-in-view-delay-2">
            <div className="card-icon-wrapper yellow">
              <svg className="card-icon hand-drawn" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="feature-card-content">
              <h3 className="card-title">Answer questions</h3>
              <p className="card-text">Questions pop in real-time. Type fast, think faster.</p>
            </div>
          </div>
          <div className="feature-card animate-fade-in-view-delay-3">
            <div className="card-icon-wrapper">
              <svg className="card-icon hand-drawn" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </div>
            <div className="feature-card-content">
              <h3 className="card-title">Save your progress</h3>
              <p className="card-text">Login to save stats, streaks, and leaderboard rankings.</p>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="intro-footer">
        <p className="footer-text">© 2026 Trivvia. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default IntroPage
