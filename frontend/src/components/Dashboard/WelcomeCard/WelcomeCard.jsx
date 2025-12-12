import React from 'react'
import { useNavigate } from 'react-router-dom'
import './WelcomeCard.css'

export default function WelcomeCard({ userName, streak, rank }) {
  const navigate = useNavigate()

  const handleContinueLearning = () => {
    navigate('/learning-path')
  }

  return (
    <div className="welcome-card">
      <div className="welcome-content">
        <h2 className="welcome-title">Welcome back, {userName}! 👋</h2>
        <p className="welcome-subtitle">
          You're on a {streak}-day streak! You are currently ranked #{rank} in your community.
        </p>
        <button className="continue-btn" onClick={handleContinueLearning}>
          Continue Learning <span className="btn-arrow">▶</span>
        </button>
      </div>
      <div className="welcome-decoration"></div>
    </div>
  )
}
