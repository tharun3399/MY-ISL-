import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import Sidebar from '../Dashboard/Sidebar/Sidebar'
import './GameField.css'

export default function GameField() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [selectedGame, setSelectedGame] = useState(null)

  const games = [
    {
      id: 'duel',
      name: '⚔️ Duel',
      description: 'Challenge another player in a 1v1 quiz battle. Answer 5 timed questions and win!',
      icon: '⚔️',
      color: '#EF4444',
      difficulty: 'Competitive',
      players: '2 Players',
      duration: '5-10 mins'
    },
    {
      id: 'games',
      name: '🏆 Live Games',
      description: 'Join a live group quiz with multiple players. Speed matters - answer fast for bonus points!',
      icon: '🏆',
      color: '#10B981',
      difficulty: 'Fast-Paced',
      players: 'Multiple',
      duration: '10-15 mins'
    },
    {
      id: 'training',
      name: '📚 Training Mode',
      description: 'Practice with AI-generated questions at your own pace. Perfect for learning.',
      icon: '📚',
      color: '#3B82F6',
      difficulty: 'Practice',
      players: 'Solo',
      duration: 'Flexible'
    }
  ]

  const handleGameSelect = (gameId) => {
    setSelectedGame(gameId)
    navigate(`/practice-mode/${gameId}`)
  }

  return (
    <div className="gamefield-wrapper">
      <Sidebar />
      <div className="gamefield-container">
        {/* Header */}
        <div className="gamefield-header">
          <div className="header-content">
            <h1 className="header-title"><span color='black'>🎮</span> GameField</h1>
            <p className="header-subtitle">Challenge yourself and compete with other learners</p>
            <div className="header-stats">
              <div className="stat">
                <span className="stat-icon">🎯</span>
                <div>
                  <div className="stat-label">Level</div>
                  <div className="stat-value">5</div>
                </div>
              </div>
              <div className="stat">
                <span className="stat-icon">⭐</span>
                <div>
                  <div className="stat-label">Rank</div>
                  <div className="stat-value">Top 10%</div>
                </div>
              </div>
              <div className="stat">
                <span className="stat-icon">🏅</span>
                <div>
                  <div className="stat-label">Achievements</div>
                  <div className="stat-value">12</div>
                </div>
              </div>
            </div>
          </div>
          <div className="header-visual">
            <div className="mascot">🤖</div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="games-container">
          <h2 className="section-title">Choose Your Game Mode</h2>
          <div className="games-grid">
            {games.map(game => (
              <div
                key={game.id}
                className="game-card"
                onClick={() => handleGameSelect(game.id)}
                style={{ borderTopColor: game.color }}
              >
                <div className="game-card-header">
                  <span className="game-icon">{game.icon}</span>
                  <h3 className="game-title">{game.name}</h3>
                </div>

                <p className="game-description">{game.description}</p>

                <div className="game-meta">
                  <div className="meta-item">
                    <span className="meta-label">Difficulty:</span>
                    <span className="meta-value">{game.difficulty}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Players:</span>
                    <span className="meta-value">{game.players}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Duration:</span>
                    <span className="meta-value">{game.duration}</span>
                  </div>
                </div>

                <button
                  className="play-btn"
                  style={{ backgroundColor: game.color }}
                >
                  Play Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-card-icon">🎮</div>
            <div className="stat-card-content">
              <div className="stat-card-label">Games Played</div>
              <div className="stat-card-value">24</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🏆</div>
            <div className="stat-card-content">
              <div className="stat-card-label">Wins</div>
              <div className="stat-card-value">18</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">⭐</div>
            <div className="stat-card-content">
              <div className="stat-card-label">Total Score</div>
              <div className="stat-card-value">4,850</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🔥</div>
            <div className="stat-card-content">
              <div className="stat-card-label">Win Streak</div>
              <div className="stat-card-value">5</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
