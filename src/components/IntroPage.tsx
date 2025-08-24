import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { generateUsername } from '../store/usernameSlice'
import './IntroPage.css'

interface IntroPageProps {
  onJoinGame: (name: string) => void
}

function IntroPage({ onJoinGame }: IntroPageProps) {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.username);

  const handleJoinGame = async () => {
    try {
      const result = await dispatch(generateUsername()).unwrap();
      onJoinGame(result);
    } catch (error) {
      console.error('Failed to generate username:', error);
      // Could add error handling UI here
    }
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

          <div className="intro-form">
            <button
              onClick={handleJoinGame}
              className={`join-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Generating Username...' : 'Join Game'}
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

