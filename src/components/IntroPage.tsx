import NavigationBar from './NavigationBar'
import './IntroPage.css'

interface IntroPageProps {
  onSelectCategory: () => void;
}

function IntroPage({ onSelectCategory }: IntroPageProps) {

  return (
    <div className="intro-page">
      <NavigationBar currentPage="home" />
      <div className="intro-container">
        <header className="intro-header">
          <div className="logo-container">
            <img 
              src="/trivvia-logo-transparent.svg" 
              alt="Trivvia Logo" 
              className="intro-logo"
              loading="eager"
              width="180"
              height="180"
            />
          </div>
          <p className="intro-subtitle">Test your knowledge with friends</p>
        </header>

        <div className="intro-content">
          <div className="intro-description">
            <h2>How to Play</h2>
            <ul className="intro-rules">
              <li>Join the game with a unique nickname</li>
              <li>Answer trivia questions as they appear</li>
              <li>Chat with other players in real-time</li>
              <li>Climb the leaderboard with correct answers</li>
            </ul>
          </div>

          <div className="intro-form">
            <button
              onClick={onSelectCategory}
              className="join-button"
            >
              Choose Category
            </button>
          </div>
        </div>

        <footer className="intro-footer">
          <p className="intro-note">
            Ready to challenge your mind? Join now and start playing!
          </p>
        </footer>
      </div>
    </div>
  )
}

export default IntroPage

