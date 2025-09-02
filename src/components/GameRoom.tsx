import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLeaderboard } from '../hooks/useLeaderboard';

import { useAppSelector } from '../store/hooks';
import Leaderboard from './Leaderboard';
import ChatComponent from './ChatComponent';
import HintDisplay from './HintDisplay';
import { formatCategory, formatDifficulty } from '../utils/categoryFormatter';
import './GameRoom.css';

interface GameRoomProps {
  playerName: string;
  onLeaveGame: () => void;
}

export default function GameRoom({ playerName, onLeaveGame }: GameRoomProps) {
  const navigate = useNavigate();
  const { sessionId } = useAppSelector((state) => state.username);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<{
    id: string;
    question: string;
    category: string;
    difficulty: string;
  } | null>(null);
  
  const [currentHint, setCurrentHint] = useState<{
    hint: string;
    done: boolean;
  } | null>(null);
  
  // Timer state - now using synchronized timer


  const [messages, setMessages] = useState<Array<{
    id: number;
    player: string;
    message: string;
    timestamp: string;
    type: 'chat' | 'answer' | 'bot';
    isOwnMessage?: boolean;
    sessionId?: string;
  }>>([]);

  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);


  // Real-time leaderboard data
  const { users: leaderboardUsers, isLoading: leaderboardLoading, onLeaderboardUpdate } = useLeaderboard();
  
  // Function to handle score updates
  const handleScoreUpdate = (scoreData: any) => {
    if (scoreData.type === 'score_update') {
      // Update the leaderboard with the new score
      onLeaderboardUpdate({
        type: 'score_update',
        session_id: scoreData.session_id,
        username: scoreData.username,
        score: scoreData.score
      });
    }
  };

  // Bot messages and trivia questions are now handled automatically by the backend
  // No need to fetch trivia questions or send bot messages from the frontend
  // The backend broadcasts:
  // 1. Trivia questions via websocket with type: 'trivia_question' (direct data structure, comes immediately on login)
  // 2. Bot messages via websocket with session_id: 'bot_session'
  // 3. Chat messages via websocket broadcast

  // Function to load chat history
  const loadChatHistory = async () => {
    try {
      setIsLoadingChatHistory(true);
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBase}/get_chat_history`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.messages && Array.isArray(data.messages)) {
          
          // Convert backend chat messages to frontend message format
          const reconstructedMessages = data.messages
            .filter((msg: any) => msg.message_body && msg.message_body.trim() !== '') // Filter out empty messages
            .map((msg: any) => {
              
              // Determine message type and if it's from the current user
              const isBotMessage = msg.message_sender === 'Trivvia Bot' || msg.session_id === 'bot_session';
              const isOwnMessage = msg.session_id === sessionId; // Compare session IDs to identify own messages
              
              return {
                id: Date.now() + Math.random(), // Generate unique ID
                player: msg.message_sender || 'Unknown User', // Use message_sender from backend (username)
                message: msg.message_body,
                timestamp: msg.message_timestamp > 0 
                  ? new Date(msg.message_timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: isBotMessage ? 'bot' as const : 'chat' as const,
                messageType: isBotMessage ? 'bot_message' : 'user_chat',
                originalTimestamp: msg.message_timestamp > 0 ? msg.message_timestamp : Math.floor(Date.now() / 1000),
                isOwnMessage: isOwnMessage, // Add flag to identify own messages
                sessionId: msg.session_id
              };
            });
          
          // Sort messages by original timestamp to ensure proper chronological order
          const sortedMessages = reconstructedMessages.sort((a: any, b: any) => {
            return a.originalTimestamp - b.originalTimestamp;
          });
          
          setMessages(sortedMessages);
        }
      } else {
        
      }
    } catch (error) {
      
    } finally {
      setIsLoadingChatHistory(false);
    }
  };

  // Function to fetch current question when user joins
  const fetchCurrentQuestion = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBase}/current_question`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.question && data.category && data.difficulty) {
          setCurrentQuestion({
            id: 'current_' + Date.now(),
            question: decodeHtmlEntities(data.question),
            category: decodeHtmlEntities(data.category),
            difficulty: decodeHtmlEntities(data.difficulty),
          });
        }
      } else {
        
      }
    } catch (error) {
      
    }
  };

  // Function to fetch current hint when user joins
  const fetchCurrentHint = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBase}/current_hint`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.hint) {
          setCurrentHint({
            hint: decodeHtmlEntities(data.hint),
            done: false
          });
        }
      } else if (response.status === 404) {
        // No hint available yet, which is fine
      } else {
        
      }
    } catch (error) {
      
    }
  };

  // WebSocket connection
  const { isConnected, sendMessage } = useWebSocket(() => {
    navigate('/');
  }, onLeaderboardUpdate, (chatData) => {
    
    // Handle trivia questions - this event comes immediately on login with current question
    // Data structure: { type, category, question, difficulty } (direct, not nested under 'data')
    if (chatData?.type === 'trivia_question') {
      
      
      setCurrentQuestion({
        id: chatData.type + '_' + Date.now(), // Generate unique ID since backend doesn't provide one
        question: decodeHtmlEntities(chatData.question),
        category: decodeHtmlEntities(chatData.category),
        difficulty: decodeHtmlEntities(chatData.difficulty),
      });
      
      // Clear hint when new question comes in
      setCurrentHint(null);
      return;
    }
    
    // Handle score updates
    if (chatData?.type === 'score_update') {
      handleScoreUpdate(chatData);
      return;
    }
    
    // Handle hints
    if (chatData?.type === 'trivia_hint') {
      
      setCurrentHint({
        hint: chatData.hint,
        done: chatData.done
      });
      return;
    }
    
    // Check if this is a chat message with the new broadcast structure
    if (chatData?.type === 'chat_message' && chatData?.message_sender && chatData?.message_body) {
      try {
        // Determine message type and if it's from the current user
        const isBotMessage = chatData.message_sender === 'TrivviaBot' || chatData.session_id === 'bot_session';
        const isOwnMessage = chatData.session_id === sessionId; // Compare session IDs to identify own messages
        
        // Create a new message object using the broadcast structure
        const newMessage = {
          id: Date.now(),
          player: chatData.message_sender || 'Unknown User',
          message: chatData.message_body,
          timestamp: new Date((chatData.message_timestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: isBotMessage ? 'bot' as const : 'chat' as const,
          messageType: isBotMessage ? 'bot_message' : 'user_chat',
          isOwnMessage: isOwnMessage, // Add flag to identify own messages
          sessionId: chatData.session_id
        };
        
        // Add the message to the state
        setMessages(prev => [...prev, newMessage]);
        
        // If this is a bot message indicating a correct answer, the backend will broadcast the next question
        if (isBotMessage && chatData.message_body.includes('Correct! The answer is')) {
          // Correct answer detected, waiting for next question from backend
        }
      } catch (error) {
        
      }
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowWelcome(false);
        setIsTransitioning(false);
        
        // Load chat history when the game starts
        loadChatHistory();
        
        // Fetch current question when user joins
        fetchCurrentQuestion();
        
        // Fetch current hint when user joins
        fetchCurrentHint();
        
        // Welcome message and trivia question will be sent by backend via websocket
      }, 300);
    }, 1500);
    return () => clearTimeout(timer);
      }, [playerName]);



  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };






  const handleSendMessage = async (message: string) => {
    // Send chat message through WebSocket with the correct payload structure
    if (isConnected && sendMessage) {
      const chatMessagePayload = {
        type: "chat_message",
        message_body: message,  
        message_sender: playerName,
        message_timestamp: Math.floor(Date.now() / 1000) // Convert to Unix timestamp
      };
      
      sendMessage(chatMessagePayload);
    } else {
      // WebSocket not connected or sendMessage not available
    }
  };

  // Handle keyboard open/close detection
  const handleKeyboardToggle = (isOpen: boolean) => {
    setIsKeyboardOpen(isOpen);
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
    <div className={`game-room ${isTransitioning ? 'fade-in' : ''} ${isKeyboardOpen ? 'keyboard-open' : ''}`}>
      <header className={`game-header ${isHeaderExpanded ? 'expanded' : ''} ${isKeyboardOpen ? 'collapsed' : ''}`}>
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
            <div className={`question-header ${isKeyboardOpen ? 'collapsed' : ''}`}>
              <span className="question-category">{currentQuestion?.category ? formatCategory(currentQuestion.category) : 'Loading...'}</span>
              <span className="question-difficulty">{currentQuestion?.difficulty ? formatDifficulty(currentQuestion.difficulty) : 'Loading...'}</span>
            </div>

            <div className="question-content">
              <h2 className="question-text">{currentQuestion?.question || 'Loading trivia question...'}</h2>
              
              {/* Display hint below the question */}
              {currentHint && (
                <HintDisplay 
                  hint={currentHint.hint}
                  done={currentHint.done}
                />
              )}
            </div>

            <ChatComponent
              messages={messages}
              onSendMessage={handleSendMessage}
              currentPlayer={playerName}
              isLoadingHistory={isLoadingChatHistory}
              onKeyboardToggle={handleKeyboardToggle}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
