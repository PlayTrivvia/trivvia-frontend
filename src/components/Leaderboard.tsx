import './Leaderboard.css'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

export interface LeaderboardUser {
  username: string;
  session_id: string;
  joined_at?: number;
  last_seen_at?: number;
  status: 'online' | 'away' | 'offline';
  best_streak: number;
  isPremium?: boolean;
}

interface LeaderboardProps {
  users: LeaderboardUser[]
  currentPlayer: string
  isLoading: boolean
  error: string | null
  currentPlayerIsPremium?: boolean
}

function Leaderboard({ users, currentPlayer, isLoading, error, currentPlayerIsPremium }: LeaderboardProps) {
  // State to track which users are updating their scores
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  // State to track previous user positions for comparison
  const [prevUserPositions, setPrevUserPositions] = useState<Map<string, number>>(new Map());

  // Ref to track if this is the first render
  const isFirstRender = useRef(true);

  // Include all users: online, away, and offline (authenticated offline users persist on leaderboard)
  const activeUsers = useMemo(() => {
    return users;
  }, [users]);
  
  // Sort users by best streak in descending order - memoized to prevent recreation
  const sortedUsers = useCallback(() => {
    return [...activeUsers].sort((a, b) => b.best_streak - a.best_streak);
  }, [activeUsers]);
  
  // Effect to track position changes and show updating animation only for users who moved up
  useEffect(() => {
    // Skip the first render to avoid unnecessary position tracking
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const newUpdatingUsers = new Set<string>();
    const currentPositions = new Map<string, number>();
    
    // Create current position map
    sortedUsers().forEach((user, index) => {
      currentPositions.set(user.session_id, index);
    });
    
    // Only check for position changes if we have previous positions (not on initial load)
    if (prevUserPositions.size > 0) {
      // Check for users who moved up in position
      sortedUsers().forEach((user, currentIndex) => {
        const prevIndex = prevUserPositions.get(user.session_id);
        if (prevIndex !== undefined && currentIndex < prevIndex) {
          // User moved up (lower index = higher position)
          newUpdatingUsers.add(user.session_id);
        }
      });
    }
    
    // Update previous positions for next comparison
    setPrevUserPositions(currentPositions);
    
    // Set updating users
    setUpdatingUsers(newUpdatingUsers);
    
    // Remove updating state after animation completes
    const timer = setTimeout(() => {
      setUpdatingUsers(new Set());
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [sortedUsers, prevUserPositions.size]); // Only depend on the size, not the entire object

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return '🥇'
      case 1:
        return '🥈'
      case 2:
        return '🥉'
      default:
        return `${index + 1}.`
    }
  }

  const getScoreColor = (streak: number) => {
    if (streak >= 10) return 'high-score'
    if (streak >= 5) return 'medium-score'
    return 'low-score'
  }

  if (isLoading) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">Leaderboard</h3>
          <span className="player-count">Loading...</span>
        </div>
        <div className="leaderboard-list">
          <div className="loading-message">Loading players...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">Leaderboard</h3>
          <span className="player-count">Error</span>
        </div>
        <div className="leaderboard-list">
          <div className="error-message">Failed to load players</div>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">Leaderboard</h3>
        <span className="player-count">{activeUsers.length} {activeUsers.length === 1 ? 'player' : 'players'}</span>
      </div>

      <div className="leaderboard-list">
        {sortedUsers().map((user, index) => (
          <div
            key={user.session_id}
            className={`player-item ${
              user.username === currentPlayer ? 'current-player' : ''
            } ${user.status === 'away' ? 'away' : ''} ${user.status === 'offline' ? 'offline' : ''} ${
              updatingUsers.has(user.session_id) ? 'updating' : ''
            }`}
          >
            <div className={`player-rank ${updatingUsers.has(user.session_id) ? 'updating' : ''}`}>
              <span className="rank-icon">{getRankIcon(index)}</span>
            </div>
            
            <div className="player-info">
              <div className="player-name-container">
                <span className="player-icon">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 14C3 11.7909 5.23858 10 8 10C10.7614 10 13 11.7909 13 14" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="player-name">{user.username.toLowerCase()}</span>
                {(user.isPremium || (user.username === currentPlayer && currentPlayerIsPremium)) && (
                  <span className="premium-crown" title="Premium member">👑</span>
                )}
                <div className="player-status">
                  {user.username === currentPlayer && (
                    <span className="you-badge">You</span>
                  )}
                  <span className={`status-indicator ${user.status === 'online' ? 'online' : user.status === 'offline' ? 'offline' : 'away'}`}>
                    ●
                  </span>
                </div>
              </div>
                             <div className={`player-score ${getScoreColor(user.best_streak)} ${updatingUsers.has(user.session_id) ? 'updating' : ''}`}>
                 🔥 {user.best_streak}
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="leaderboard-footer">
        <p className="scoring-info">
          🔥 <strong>Streaks:</strong> Consecutive correct answers build your streak!
        </p>
      </div>
    </div>
  )
}

export default Leaderboard

