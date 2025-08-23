import './Leaderboard.css'

export interface Player {
  id: number
  name: string
  score: number
  isOnline: boolean
}

interface LeaderboardProps {
  players: Player[]
  currentPlayer: string
}

function Leaderboard({ players, currentPlayer }: LeaderboardProps) {
  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

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

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">Leaderboard</h3>
        <span className="player-count">{players.length} players</span>
      </div>

      <div className="leaderboard-list">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`player-item ${
              player.name === currentPlayer ? 'current-player' : ''
            } ${!player.isOnline ? 'offline' : ''}`}
          >
            <div className="player-rank">
              <span className="rank-icon">{getRankIcon(index)}</span>
            </div>
            
            <div className="player-info">
              <div className="player-name-container">
                <span className="player-name">{player.name}</span>
                <div className="player-status">
                  <span className={`status-indicator ${player.isOnline ? 'online' : 'offline'}`}>
                    ●
                  </span>
                  {player.name === currentPlayer && (
                    <span className="you-badge">You</span>
                  )}
                </div>
              </div>
              <div className={`player-score ${getScoreColor(player.score)}`}>
                {player.score} pts
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

