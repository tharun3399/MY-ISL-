import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import welcomeVideo from '../Wan_ISL_Welcome.mp4'
import './WelcomeCard.css'

export default function WelcomeCard({ userName, streak, rank }) {
  const navigate = useNavigate()
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Autoplay prevented:', err)
      })
    }
  }, [])

  const handleContinueLearning = () => {
    navigate('/learning-path')
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
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
      <div className="welcome-video-container">
        <video
          ref={videoRef}
          className="welcome-video"
          muted
          loop
          controlsList="nodownload"
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23121826' width='400' height='300'/%3E%3Ccircle cx='200' cy='150' r='60' fill='%2300E5FF' opacity='0.2'/%3E%3Cpolygon points='185,125 185,175 225,150' fill='%2300E5FF' opacity='0.6'/%3E%3C/svg%3E"
        >
          <source src={welcomeVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="welcome-decoration"></div>
    </div>
  )
}
