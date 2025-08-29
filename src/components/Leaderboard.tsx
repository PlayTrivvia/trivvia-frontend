import './Leaderboard.css'

export interface LeaderboardUser {
  username: string;
  session_id: string;
  joined_at: number;
  last_seen_at: number;
  status: 'online' | 'away';
  score: number;
}

interface LeaderboardProps {
  users: LeaderboardUser[]
  currentPlayer: string
  isLoading: boolean
  error: string | null
}

function Leaderboard({ users, currentPlayer, isLoading, error }: LeaderboardProps) {
  // Debug: Log the users array to see their status
  console.log('📊 Leaderboard received users:', users);
  
  // Filter out dropped users (they won't be in the users array anyway)
  // Show both online and away users
  const activeUsers = users.filter(user => user.status === 'online' || user.status === 'away');
  
  // Sort users by score in descending order
  const sortedUsers = [...activeUsers].sort((a, b) => b.score - a.score)

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

  const getScoreColor = (score: number) => {
    if (score >= 400) return 'high-score'
    if (score >= 250) return 'medium-score'
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
        {sortedUsers.map((user, index) => (
          <div
            key={user.session_id}
            className={`player-item ${
              user.username === currentPlayer ? 'current-player' : ''
            } ${user.status === 'away' ? 'offline' : ''}`}
          >
            <div className="player-rank">
              <span className="rank-icon">{getRankIcon(index)}</span>
            </div>
            
            <div className="player-info">
              <div className="player-name-container">
                <span className="player-name">{user.username}</span>
                <div className="player-status">
                  {user.username === currentPlayer && (
                    <span className="you-badge">You</span>
                  )}
                  <span className={`status-indicator ${user.status === 'online' ? 'online' : 'offline'}`}>
                    ●
                  </span>
                </div>
              </div>
              <div className={`player-score ${getScoreColor(user.score)}`}>
                {user.score} pts
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="leaderboard-footer">
        <p className="scoring-info">
          💡 <strong>Scoring:</strong> Faster answers earn more points!
        </p>
      </div>
    </div>
  )
}

export default Leaderboard

