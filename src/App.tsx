import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { releaseUsername } from './store/usernameSlice'
import IntroPage from './components/IntroPage'
import GameRoom from './components/GameRoom'
import './App.css'

type Page = 'intro' | 'game'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('intro')
  const dispatch = useAppDispatch();
  const { currentUsername } = useAppSelector((state) => state.username);

  const handleJoinGame = (name: string) => {
    setCurrentPage('game')
  }

  const handleLeaveGame = async () => {
    // Release username before leaving
    if (currentUsername) {
      try {
        await dispatch(releaseUsername(currentUsername)).unwrap();
      } catch (error) {
        console.error('Failed to release username:', error);
      }
    }
    setCurrentPage('intro')
  }

  // Handle tab close/window unload to release username
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentUsername && currentPage === 'game') {
        // Use sendBeacon for more reliable delivery during page unload
        const data = JSON.stringify({ username: currentUsername });
        navigator.sendBeacon('http://localhost:8081/release_username', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUsername, currentPage]);

  return (
    <div className="app">
      {currentPage === 'intro' && (
        <IntroPage onJoinGame={handleJoinGame} />
      )}
      {currentPage === 'game' && currentUsername && (
        <GameRoom playerName={currentUsername} onLeaveGame={handleLeaveGame} />
      )}
    </div>
  )
}

export default App
