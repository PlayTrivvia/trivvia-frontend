import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import IntroPage from './components/IntroPage'
import GameRoom from './components/GameRoom'
import AboutPage from './components/AboutPage'

import { useUserStatus } from './hooks/useHeartbeat'
import { useAppSelector, useAppDispatch } from './store/hooks'
import { clearUsername } from './store/usernameSlice'
import './App.css'
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react'

// Wrapper component to handle navigation and state management
function AppContent() {
  const navigate = useNavigate();
  const { currentUsername } = useAppSelector((state) => state.username);
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    // When leaving /game, clear username
    return () => {
      if (location.pathname === '/game') {
        dispatch(clearUsername());
      }
    };
  }, [location.pathname, dispatch]);
  
  
  // Start user status monitoring when user is in game
  useUserStatus();

  const handleJoinGame = () => {
    navigate('/game');
  }

  const handleLeaveGame = async () => {
    dispatch(clearUsername());
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
            /> 
          } 
        />
        <Route 
          path="/game" 
          element={
            currentUsername ? (
              <GameRoom 
                playerName={currentUsername} 
                onLeaveGame={handleLeaveGame}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/about" 
          element={<AboutPage />} 
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
