import React from 'react'
import './CommunityRanks.css'

export default function CommunityRanks() {
  // TODO: Replace with API call to fetch community ranks from backend
  // const ranks = await axios.get('http://localhost:5000/api/community/ranks', { withCredentials: true })
  const ranks = [
    { rank: 1, name: 'Sarah W.', xp: 3200, avatar: 'SW', color: '#fbbf24' },
    { rank: 2, name: 'Mike T.', xp: 2950, avatar: 'MT', color: '#9ca3af' },
    { rank: 3, name: 'You', xp: 2450, avatar: 'AJ', color: '#a78bfa', isYou: true }
  ]

  return (
    <div className="community-ranks">
      <div className="ranks-header">
        <h3 className="ranks-title">⭐ Community Ranks</h3>
        <a href="#" className="view-all-link">View All</a>
      </div>

      <div className="ranks-list">
        {ranks.map((rank, index) => (
          <div key={index} className={`rank-item ${rank.isYou ? 'rank-you' : ''}`}>
            <div className="rank-position">{rank.rank}</div>
            <div className={`rank-avatar ${rank.isYou ? 'avatar-highlight' : ''}`} style={{ backgroundColor: rank.color }}>
              {rank.avatar}
            </div>
            <div className="rank-info">
              <div className="rank-name">{rank.name}</div>
              <div className="rank-xp">{rank.xp} XP</div>
            </div>
            {!rank.isYou && <div className="rank-medal">🏅</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
