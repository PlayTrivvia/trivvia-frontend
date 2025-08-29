import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import IntroPage from './components/IntroPage'
import GameRoom from './components/GameRoom'
import Navigation from './components/Navigation'
import { useUserStatus } from './hooks/useHeartbeat'
import { useAppSelector } from './store/hooks'
import './App.css'

// Wrapper component to handle navigation and state management
function AppContent() {
  const navigate = useNavigate();
  const { currentUsername } = useAppSelector((state) => state.username);
  const [isGameLoading, setIsGameLoading] = useState(false);
  
  // Start user status monitoring when user is in game
  useUserStatus();

  const handleJoinGame = () => {
    navigate('/game');
  }

  const handleLeaveGame = async () => {
    // No need to manually release username - WebSocket handles this automatically
    // Just navigate away
    navigate(-1);
  }

  // No need to handle tab close/window unload - WebSocket handles cleanup automatically
  
  // No need to handle navigation changes - WebSocket handles cleanup automatically

  return (
    <div className="app">
      <Navigation isGameLoading={isGameLoading} />
      <Routes>
        <Route path="/" element={<IntroPage onJoinGame={handleJoinGame} />} />
        <Route 
          path="/intro" 
          element={<Navigate to="/" replace />} 
        />
        <Route 
          path="/game" 
          element={
            currentUsername ? (
              <GameRoom 
                playerName={currentUsername} 
                onLeaveGame={handleLeaveGame}
                onLoadingStateChange={setIsGameLoading}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
