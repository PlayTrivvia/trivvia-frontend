import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLeaderboard } from '../hooks/useLeaderboard';
import Leaderboard from './Leaderboard';
import ChatComponent from './ChatComponent';
import { formatCategory } from '../utils/categoryFormatter';
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

  const [currentQuestion, setCurrentQuestion] = useState<{
    id: string;
    question: string;
    category: string;
    difficulty: string;
  } | null>(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [messages, setMessages] = useState<Array<{
    id: number;
    player: string;
    message: string;
    timestamp: string;
    type: 'chat' | 'answer' | 'bot';
  }>>([]);

  // store the last correct answer + who answered first
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState<{
    answer: string;
    player: string;
  } | null>(null);

  // Real-time leaderboard data
  const { users: leaderboardUsers, isLoading: leaderboardLoading, onLeaderboardUpdate } = useLeaderboard();

  // WebSocket connection
  useWebSocket(() => {
    navigate('/');
  }, onLeaderboardUpdate);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowWelcome(false);
        setIsTransitioning(false);
        onLoadingStateChange(false);
        fetchTriviaQuestion();
      }, 300);
    }, 1500);

    onLoadingStateChange(true);
    return () => clearTimeout(timer);
  }, [onLoadingStateChange]);

  // Timer effect
  useEffect(() => {
    let interval: number;
    
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer ran out, reset to 10 minutes
      setTimeLeft(600);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, timeLeft]);

  // Start timer when component mounts
  useEffect(() => {
    setIsTimerRunning(true);
  }, []);

  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const fetchTriviaQuestion = async () => {
    try {
      const response = await fetch('http://localhost:8081/get_trivia_question');
      if (response.ok) {
        const data = await response.json();
        setCurrentQuestion({
          id: data.id,
          question: decodeHtmlEntities(data.question),
          category: decodeHtmlEntities(data.category),
          difficulty: decodeHtmlEntities(data.difficulty),
        });
        // reset last correct answer when new question is fetched
        setLastCorrectAnswer(null);
      }
    } catch (error) {
      console.error('Failed to fetch trivia question:', error);
    }
  };

  const handleSendMessage = async (message: string) => {
    // always add chat message immediately
    const newMessage = {
      id: Date.now(),
      player: playerName,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'chat' as const,
    };
    setMessages(prev => [...prev, newMessage]);
  
    // then check if it's correct
    if (currentQuestion && message.trim().length > 0) {
      try {
        const response = await fetch('http://localhost:8081/check_answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentQuestion.id,
            answer: message.trim(),
          }),
        });
  
        if (response.ok) {
          const result = await response.json();
          if (result.correct === true) {
            // Bot message (multi-line)
            const botMessage = {
              id: Date.now() + 1,
              player: 'Trivvia Bot',
              message: `<span class="bot-question">${decodeHtmlEntities(currentQuestion.question)}</span><br/>Correct! The answer is: ${decodeHtmlEntities(result.answer)}<br/>First to answer: @${playerName}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'bot' as const,
            };
            
  
            setMessages(prev => [...prev, botMessage]);
  
            // set first correct answer (only once)
            setLastCorrectAnswer(prev => prev ?? {
              answer: result.answer,
              player: playerName,
            });
  
            setTimeout(() => {
              fetchTriviaQuestion();
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Failed to check answer:', error);
      }
    }
  };
  

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
    );
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
                <path d="M12 18L24 30L36 18" stroke="#6366F1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="leave-button secondary" onClick={onLeaveGame}>
              Leave Game
            </button>
          </div>
        </div>

        {isHeaderExpanded && (
          <div className="header-leaderboard">
            <Leaderboard
              users={leaderboardUsers}
              currentPlayer={playerName}
              isLoading={leaderboardLoading}
              error={null}
              timerValue={timeLeft}
              formatTime={formatTime}
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
            timerValue={timeLeft}
            formatTime={formatTime}
          />
        </aside>

        <main className="game-main">
          <div className="unified-chat-section">
            <div className="question-header">
              <span className="question-category">{currentQuestion?.category ? formatCategory(currentQuestion.category) : 'Loading...'}</span>
              <span className="question-difficulty">{currentQuestion?.difficulty || 'Loading...'}</span>
            </div>

            <div className="question-content">
              <h2 className="question-text">{currentQuestion?.question || 'Loading trivia question...'}</h2>
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
  );
}
