import { useState } from 'react'
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
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [hasAnswered, setHasAnswered] = useState(false)
  const [messages, setMessages] = useState(mockMessages)

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentAnswer.trim() && !hasAnswered) {
      const newMessage = {
        id: messages.length + 1,
        player: playerName,
        message: currentAnswer.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'answer' as const
      }
      setMessages([...messages, newMessage])
      setHasAnswered(true)
      setCurrentAnswer('')
    }
  }

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

  return (
    <div className="game-room">
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
        <main className="game-main">
          <div className="question-section">
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
            </div>

            <form className="answer-form" onSubmit={handleSubmitAnswer}>
              <div className="answer-input-group">
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={hasAnswered ? "Answer submitted!" : "Type your answer..."}
                  className="answer-input"
                  disabled={hasAnswered}
                />
                <button
                  type="submit"
                  disabled={!currentAnswer.trim() || hasAnswered}
                  className="submit-answer-button"
                >
                  {hasAnswered ? "Submitted" : "Submit"}
                </button>
              </div>
            </form>
          </div>

          <ChatComponent 
            messages={messages}
            onSendMessage={handleSendMessage}
            currentPlayer={playerName}
          />
        </main>

        <aside className="game-sidebar">
          <Leaderboard players={mockPlayers} currentPlayer={playerName} />
        </aside>
      </div>
    </div>
  )
}

export default GameRoom

