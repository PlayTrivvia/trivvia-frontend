import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLeaderboard } from '../hooks/useLeaderboard';
import Leaderboard from './Leaderboard';
import ChatComponent from './ChatComponent';
import './GameRoom.css';

interface GameRoomProps {
  playerName: string;
  onLeaveGame: () => void;
  onLoadingStateChange: (loading: boolean) => void;
}

export default function GameRoom({ playerName, onLeaveGame, onLoadingStateChange }: GameRoomProps) {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  
  const [messages, setMessages] = useState<Array<{
    id: number;
    player: string;
    message: string;
    timestamp: string;
    type: 'chat' | 'answer';
  }>>([]);

  // Real-time leaderboard data
  const { users: leaderboardUsers, isLoading: leaderboardLoading, onLeaderboardUpdate } = useLeaderboard();

  // WebSocket connection for both session management and leaderboard updates
  useWebSocket(() => {
    // When session is dropped, redirect to home
    navigate('/');
  }, onLeaderboardUpdate);

  useEffect(() => {
    // Show welcome screen for 1.5 seconds then start transition
    const timer = setTimeout(() => {
      setIsTransitioning(true)
      // After transition animation completes, hide welcome screen
      setTimeout(() => {
        setShowWelcome(false)
        setIsTransitioning(false)
        // Notify parent component that loading is complete
        onLoadingStateChange(false)
      }, 300) // 300ms for fade transition
    }, 1500)

    // Notify parent component that loading has started
    onLoadingStateChange(true)

    return () => clearTimeout(timer)
  }, [onLoadingStateChange])

  const handleSendMessage = (message: string) => {
    const newMessage = {
      id: messages.length + 1,
      player: playerName,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'chat' as const
    }
    setMessages([...messages, newMessage])
  }

  if (showWelcome) {
    return (
      <div className="game-room">
        <div className={`welcome-screen ${isTransitioning ? 'fade-out' : ''}`}>
          <div className="welcome-content">
            <h1 className="welcome-title">Welcome to Trivvia!</h1>
            <p className="welcome-subtitle">Your nickname is:</p>
            <div className="nickname-display">{playerName}</div>
            <div className="welcome-loading">
              <span className="loading-dots">Preparing your game</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`game-room ${isTransitioning ? 'fade-in' : ''}`}>
      <header className={`game-header ${isHeaderExpanded ? 'expanded' : ''}`}>
        <div className="header-main">
          <div className="header-left">
            <h1 className="game-title">Trivvia</h1>
            <span className="player-welcome">Welcome, {playerName}!</span>
          </div>
          <div className="header-right">
            <button 
              className={`mobile-menu-button ${isHeaderExpanded ? 'expanded' : ''}`}
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              aria-label={isHeaderExpanded ? 'Close leaderboard' : 'Open leaderboard'}
                      >
            <svg width="34" height="34" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 18L24 30L36 18" stroke="#6366F1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
            <button className="leave-button secondary" onClick={onLeaveGame}>
              Leave Game
            </button>
          </div>
        </div>
        
        {/* Collapsible leaderboard section */}
        {isHeaderExpanded && (
          <div className="header-leaderboard">
            <Leaderboard 
              users={leaderboardUsers}
              currentPlayer={playerName}
              isLoading={leaderboardLoading}
              error={null}
            />
          </div>
        )}
      </header>

      <div className="game-layout">
        <aside className="game-sidebar">
          <Leaderboard 
            users={leaderboardUsers}
            currentPlayer={playerName}
            isLoading={leaderboardLoading}
            error={null}
          />
        </aside>

        <main className="game-main">
          <div className="unified-chat-section">
            <div className="question-header">
              <span className="question-category">Geography</span>
              <span className="question-difficulty">Medium</span>
              <div className="timer">
                <span className="timer-text">Time: 25s</span>
                <div className="timer-bar">
                  <div 
                    className="timer-progress" 
                    style={{ width: `${(25 / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="question-content">
              <h2 className="question-text">What is the capital city of Australia?</h2>
              <div className="answer-info">
                <span className="correct-answer">Canberra</span>
                <span className="winner-details">is the right answer! First was <strong>@Alex</strong></span>
              </div>
            </div>

            <ChatComponent 
              messages={messages}
              onSendMessage={handleSendMessage}
              currentPlayer={playerName}
            />
          </div>
        </main>
      </div>
      

    </div>
  )
}

