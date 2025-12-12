import React from 'react'
import './StatsCards.css'

export default function StatsCards({ stats }) {
  return (
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-icon stat-icon-orange">🔥</div>
        <div className="stat-content">
          <div className="stat-label">Daily Streak</div>
          <div className="stat-value">{stats.dailyStreak} Days</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon stat-icon-blue">🏅</div>
        <div className="stat-content">
          <div className="stat-label">Total XP</div>
          <div className="stat-value">{stats.totalXP} XP</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon stat-icon-purple">🎯</div>
        <div className="stat-content">
          <div className="stat-label">Current Goal</div>
          <div className="stat-value">{stats.currentGoal} Mins/Day</div>
        </div>
      </div>
    </div>
  )
}
