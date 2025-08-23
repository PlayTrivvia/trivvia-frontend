import { useState } from 'react'
import IntroPage from './components/IntroPage'
import GameRoom from './components/GameRoom'
import './App.css'

type Page = 'intro' | 'game'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('intro')
  const [playerName, setPlayerName] = useState('')

  const handleJoinGame = (name: string) => {
    setPlayerName(name)
    setCurrentPage('game')
  }

  const handleLeaveGame = () => {
    setCurrentPage('intro')
    setPlayerName('')
  }

  return (
    <div className="app">
      {currentPage === 'intro' && (
        <IntroPage onJoinGame={handleJoinGame} />
      )}
      {currentPage === 'game' && (
        <GameRoom playerName={playerName} onLeaveGame={handleLeaveGame} />
      )}
    </div>
  )
}

export default App
