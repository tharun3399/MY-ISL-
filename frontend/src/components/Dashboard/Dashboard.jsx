import React, { useState, useContext, useEffect } from 'react'
import { AuthContext } from '../../context/AuthContext'
import Sidebar from './Sidebar/Sidebar'
import DashboardContent from './DashboardContent/DashboardContent'
import './Dashboard.css'

export default function Dashboard() {
  const { authState } = useContext(AuthContext)
  const user = authState?.user || {}
  const [screenSize, setScreenSize] = useState('laptop')
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [manualScreenMode, setManualScreenMode] = useState(null)

  const stats = {
    dailyStreak: 12,
    totalXP: 2450,
    currentGoal: 30,
    rank: 3
  }

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      if (!manualScreenMode) {
        if (window.innerWidth < 768) {
          setScreenSize('phone')
        } else if (window.innerWidth < 1024) {
          setScreenSize('tablet')
        } else {
          setScreenSize('laptop')
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [manualScreenMode])

  // Set initial screen size
  useEffect(() => {
    if (!manualScreenMode) {
      if (window.innerWidth < 768) {
        setScreenSize('phone')
      } else if (window.innerWidth < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('laptop')
      }
    }
  }, [])

  const handleScreenModeChange = (mode) => {
    setManualScreenMode(mode)
    setScreenSize(mode)
  }

  return (
    <div className={`dashboard dashboard-${screenSize}`}>
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="dashboard-header-actions">
            <input type="text" placeholder="Search lessons..." className="search-input" />
            <div className="screen-selector">
              <button
                className={`screen-btn ${screenSize === 'phone' ? 'active' : ''}`}
                onClick={() => handleScreenModeChange('phone')}
                title="Phone View"
              >
                📱 Phone
              </button>
              <button
                className={`screen-btn ${screenSize === 'tablet' ? 'active' : ''}`}
                onClick={() => handleScreenModeChange('tablet')}
                title="Tablet View"
              >
                📱 Tablet
              </button>
              <button
                className={`screen-btn ${screenSize === 'laptop' ? 'active' : ''}`}
                onClick={() => handleScreenModeChange('laptop')}
                title="Laptop View"
              >
                💻 Laptop
              </button>
            </div>
            <div className="notification-icon">🔔</div>
          </div>
        </div>

        <DashboardContent 
          user={user} 
          stats={stats} 
          screenSize={screenSize}
        />
      </div>
    </div>
  )
}
