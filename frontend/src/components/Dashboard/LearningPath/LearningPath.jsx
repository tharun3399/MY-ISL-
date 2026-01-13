import React, { useState, useContext, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../../context/AuthContext'
import Sidebar from '../Sidebar/Sidebar'
import axios from 'axios'
import './LearningPath.css'

export default function LearningPath() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completedModules, setCompletedModules] = useState(new Set())
  const [pathData, setPathData] = useState('')
  const nodeRefs = useRef([])
  const journeyMapRef = useRef(null)

  // Fetch modules from API on component mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/lessons/modules`, { withCredentials: true })
        if (response.data.ok) {
          const modulesData = response.data.modules.map((module, index) => ({
            ...module,
            title: module.module_name,
            order: index,
            completed: false
          }))
          setModules(modulesData)
          if (modulesData.length > 0) {
            setCompletedModules(new Set([modulesData[0].id]))
          }
        } else {
          setError('Failed to fetch modules')
        }
      } catch (err) {
        console.error('Error fetching modules:', err)
        setError('Failed to fetch modules')
      } finally {
        setLoading(false)
      }
    }
    fetchModules()
  }, [])

  // Recalculate path on module change and window resize
  useEffect(() => {
    const calculatePath = () => {
      if (!journeyMapRef.current || nodeRefs.current.length < 2) return

      const mapRect = journeyMapRef.current.getBoundingClientRect()
      let pathD = ''

      for (let i = 0; i < nodeRefs.current.length - 1; i++) {
        if (!nodeRefs.current[i] || !nodeRefs.current[i + 1]) continue

        const node1Rect = nodeRefs.current[i].getBoundingClientRect()
        const node2Rect = nodeRefs.current[i + 1].getBoundingClientRect()

        // Calculate positions relative to journey-map container
        const x1 = node1Rect.left - mapRect.left + node1Rect.width / 2
        const y1 = node1Rect.bottom - mapRect.top
        const x2 = node2Rect.left - mapRect.left + node2Rect.width / 2
        const y2 = node2Rect.top - mapRect.top

        const distance = y2 - y1
        const waveDepth = Math.abs(x2 - x1) * 0.5 + 40 // Dynamic wave depth based on horizontal distance

        if (i === 0) {
          pathD = `M ${x1} ${y1}`
        }

        // Create smooth flowing wave with S-curves like the reference
        const cpY1 = y1 + distance * 0.25
        const cpY2 = y1 + distance * 0.75
        
        pathD += ` C ${x1 + waveDepth} ${cpY1}, ${x2 - waveDepth} ${cpY2}, ${x2} ${y2}`
      }

      setPathData(pathD)
    }

    // Calculate path after elements render
    const timer = setTimeout(calculatePath, 100)
    window.addEventListener('resize', calculatePath)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', calculatePath)
    }
  }, [modules, loading])

  const handleModuleClick = (moduleId, status) => {
    if (status !== 'locked') {
      navigate(`/module/${moduleId}/topics`)
    }
  }

  const getModuleStatus = (index) => {
    if (completedModules.has(modules[index].id)) {
      return 'completed'
    }
    if (index === 0 || (index > 0 && completedModules.has(modules[index - 1].id))) {
      return 'current'
    }
    return 'locked'
  }

  const getProgressPercentage = (index) => {
    // Demo: assign progress values
    const progressValues = [100, 75, 50, 25, 0]
    return progressValues[index] || 0
  }

  return (
    <div className="learning-path-wrapper">
      <Sidebar />
      <div className="learning-path-container">
        {loading && <div className="loading-spinner">Loading your journey...</div>}
        {error && <div className="error-message">Error: {error}</div>}
        {!loading && !error && (
          <>
            <div className="journey-header">
              <h1 className="journey-title">🗺️ Your Learning Journey</h1>
              <p className="journey-subtitle">Master Indian Sign Language one checkpoint at a time</p>
              <div className="journey-stats">
                <div className="stat-item">
                  <span className="stat-icon">✓</span>
                  <span className="stat-text">{completedModules.size} Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">⚡</span>
                  <span className="stat-text">{modules.length - completedModules.size} In Progress</span>
                </div>
              </div>
            </div>

            <div className="journey-map" ref={journeyMapRef}>
              <svg className="journey-path-svg" preserveAspectRatio="none" style={{width: '100%', height: '100%'}}>
                {/* Draw connecting path line */}
                {modules.length > 1 && (
                  <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00E5FF" />
                      <stop offset="100%" stopColor="#39FF14" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                )}
                
                {/* Connecting curved path - calculated from card positions */}
                {pathData && (
                  <path
                    d={pathData}
                    stroke="url(#pathGradient)"
                    strokeWidth="12"
                    fill="none"
                    filter="url(#glow)"
                    className="path-line"
                  />
                )}
              </svg>

              <div className="journey-nodes">
                {modules.map((module, index) => {
                  const status = getModuleStatus(index)
                  const progress = getProgressPercentage(index)

                  return (
                    <div 
                      key={module.id}
                      className="journey-node-wrapper"
                      ref={(el) => {
                        if (el) nodeRefs.current[index] = el
                      }}
                    >
                      <div
                        className={`journey-node node-${status}`}
                        onClick={() => handleModuleClick(module.id, status)}
                        style={{ cursor: status === 'locked' ? 'not-allowed' : 'pointer' }}
                      >
                        {/* Progress Ring */}
                        <div className="progress-ring-container">
                          <svg className="progress-ring" viewBox="0 0 120 120">
                            <circle className="progress-bg" cx="60" cy="60" r="50"/>
                            <circle 
                              className="progress-fill" 
                              cx="60" cy="60" r="50"
                              style={{ 
                                strokeDasharray: `${(progress / 100) * 314.159} 314.159`,
                                opacity: status === 'completed' ? 1 : 0.6
                              }}
                            />
                          </svg>
                          
                          {/* Center Badge */}
                          <div className="node-badge">
                            {status === 'completed' && <span className="badge-icon">✓</span>}
                            {status === 'current' && <span className="badge-icon pulse">▶</span>}
                            {status === 'locked' && <span className="badge-icon">🔒</span>}
                          </div>
                        </div>

                        {/* Node Info */}
                        <div className="node-info">
                          <h3 className="node-title">{module.title}</h3>
                          <p className="node-progress">{progress}% Complete</p>
                          {status === 'locked' && (
                            <div className="lock-tooltip">
                              Complete previous module to unlock
                            </div>
                          )}
                          {status === 'current' && (
                            <button className="start-btn">Start Module</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="journey-tips">
              <h3 className="tips-title">💡 Pro Tips</h3>
              <div className="tips-grid">
                <div className="tip-card">
                  <span className="tip-icon">🎯</span>
                  <p>Complete each module sequentially for the best learning outcome</p>
                </div>
                <div className="tip-card">
                  <span className="tip-icon">⏰</span>
                  <p>Spend 15-30 minutes daily on your learning journey</p>
                </div>
                <div className="tip-card">
                  <span className="tip-icon">🎮</span>
                  <p>Use practice mode to master signs with AI feedback</p>
                </div>
                <div className="tip-card">
                  <span className="tip-icon">🏆</span>
                  <p>Unlock achievements as you progress through modules</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
