import { useState, useEffect } from 'react'
import ChatComponent from './ChatComponent'
import Leaderboard from './Leaderboard'
import './GameRoom.css'

interface GameRoomProps {
  playerName: string
  onLeaveGame: () => void
}

// Mock data for static layout
const mockQuestion = {
  id: 1,
  text: "What is the capital city of Australia?",
  category: "Geography",
  difficulty: "Medium",
  timeRemaining: 25
}

const mockPlayers = [
  { id: 1, name: "Sarah", score: 450, isOnline: true },
  { id: 2, name: "Mike", score: 380, isOnline: true },
  { id: 3, name: "Emma", score: 320, isOnline: false },
  { id: 4, name: "Alex", score: 290, isOnline: true },
  { id: 5, name: "Lisa", score: 275, isOnline: true },
]

const mockMessages = [
  { id: 1, player: "Sarah", message: "Good luck everyone!", timestamp: "2:34 PM", type: "chat" as const },
  { id: 2, player: "Mike", message: "Sydney", timestamp: "2:35 PM", type: "answer" as const },
  { id: 3, player: "Emma", message: "I think it's Canberra", timestamp: "2:35 PM", type: "answer" as const },
  { id: 4, player: "Alex", message: "Canberra for sure", timestamp: "2:35 PM", type: "answer" as const },
  { id: 5, player: "Sarah", message: "Wait, is it Melbourne?", timestamp: "2:35 PM", type: "chat" as const },
]

function GameRoom({ playerName, onLeaveGame }: GameRoomProps) {
  const [messages, setMessages] = useState(mockMessages)
  const [showWelcome, setShowWelcome] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // Show welcome screen for 1.5 seconds then start transition
    const timer = setTimeout(() => {
      setIsTransitioning(true)
      // After transition animation completes, hide welcome screen
      setTimeout(() => {
        setShowWelcome(false)
        setIsTransitioning(false)
      }, 300) // 300ms for fade transition
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

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
      <header className="game-header">
        <div className="header-left">
          <h1 className="game-title">Trivvia</h1>
          <span className="player-welcome">Welcome, {playerName}!</span>
        </div>
        <button className="leave-button secondary" onClick={onLeaveGame}>
          Leave Game
        </button>
      </header>

      <div className="game-layout">
        <aside className="game-sidebar">
          <Leaderboard players={mockPlayers} currentPlayer={playerName} />
        </aside>

        <main className="game-main">
          <div className="unified-chat-section">
            <div className="question-header">
              <span className="question-category">{mockQuestion.category}</span>
              <span className="question-difficulty">{mockQuestion.difficulty}</span>
              <div className="timer">
                <span className="timer-text">Time: {mockQuestion.timeRemaining}s</span>
                <div className="timer-bar">
                  <div 
                    className="timer-progress" 
                    style={{ width: `${(mockQuestion.timeRemaining / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="question-content">
              <h2 className="question-text">{mockQuestion.text}</h2>
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

export default GameRoom

