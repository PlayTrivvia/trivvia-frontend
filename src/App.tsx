import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import IntroPage from './components/IntroPage'
import GameRoom from './components/GameRoom'
import AboutPage from './components/AboutPage'

import { useUserStatus } from './hooks/useHeartbeat'
import { useAppSelector } from './store/hooks'
import './App.css'

// Wrapper component to handle navigation and state management
function AppContent() {
  const navigate = useNavigate();
  const { currentUsername } = useAppSelector((state) => state.username);
  
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

  const handleGoToAbout = () => {
    navigate('/about');
  }

  const handleBackFromAbout = () => {
    navigate('/');
  }

  return (
    <div className="app">
      <Routes>
        <Route 
          path="/" 
          element={
            <IntroPage 
              onJoinGame={handleJoinGame} 
              onGoToAbout={handleGoToAbout}
            /> 
          } 
        />
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
                onGoToAbout={handleGoToAbout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/about" 
          element={<AboutPage onBack={handleBackFromAbout} />} 
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
