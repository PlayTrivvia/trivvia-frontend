import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import IntroPage from './components/IntroPage'
import RoomsPage from './components/RoomsPage'
import GameRoom from './components/GameRoom'
import AboutPage from './components/AboutPage'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import AccountPage from './components/AccountPage'
import PremiumPage from './components/PremiumPage'

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

  const clearUsernameAndNavigate = () => {
    dispatch(clearUsername());
    navigate('/rooms');
  };

  // Removed useEffect that was causing race condition with leave game navigation
  
  
  // Start user status monitoring when user is in game
  useUserStatus();

  const handleSelectCategory = () => {
    navigate('/rooms');
  }

  const handleJoinRoom = async () => {
    // This function is no longer used since username generation is handled in RoomsPage
    // Keeping it for backward compatibility but it won't be called
    navigate('/game');
  }

  const handleLeaveGame = async () => {
    clearUsernameAndNavigate();
  }

  return (
    <div className="app">
      <Routes>
        <Route 
          path="/" 
          element={
            <IntroPage 
              onSelectCategory={handleSelectCategory}
            /> 
          } 
        />
        <Route 
          path="/rooms" 
          element={
            <RoomsPage 
              onJoinRoom={handleJoinRoom}
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
              <Navigate to="/rooms" replace />
            )
          } 
        />
        <Route 
          path="/about" 
          element={<AboutPage />} 
        />
        <Route 
          path="/login" 
          element={<LoginPage />} 
        />
        <Route 
          path="/signup" 
          element={<SignupPage />} 
        />
        <Route 
          path="/account" 
          element={<AccountPage />} 
        />
        <Route 
          path="/premium" 
          element={<PremiumPage />} 
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
