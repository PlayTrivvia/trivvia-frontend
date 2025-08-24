import { useState } from 'react'
import './IntroPage.css'

interface IntroPageProps {
  onJoinGame: (name: string) => void
}

function IntroPage({ onJoinGame }: IntroPageProps) {
  const [nickname, setNickname] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nickname.trim().length < 2) {
      return
    }
    setIsLoading(true)
    // Simulate a brief loading state
    setTimeout(() => {
      onJoinGame(nickname.trim())
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="intro-page">
      <div className="intro-container">
        <header className="intro-header">
          <div className="logo-container">
            <img src="/trivvia-logo-transparent.png" alt="Trivvia Logo" className="intro-logo" />
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

          <form className="intro-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nickname" className="form-label">
                Choose your nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname..."
                className="nickname-input"
                maxLength={20}
                disabled={isLoading}
                autoFocus
              />
              <p className="form-hint">
                2-20 characters, visible to other players
              </p>
            </div>

            <button
              type="submit"
              className={`join-button ${isLoading ? 'loading' : ''}`}
              disabled={nickname.trim().length < 2 || isLoading}
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </button>
          </form>
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

