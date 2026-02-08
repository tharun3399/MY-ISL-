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
  const svgRef = useRef(null)

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
      if (!journeyMapRef.current || nodeRefs.current.length < 2 || !svgRef.current) return

      try {
        const container = journeyMapRef.current
        const svg = svgRef.current
        
        // Set SVG dimensions to match container
        const rect = container.getBoundingClientRect()
        svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`)
        
        let pathD = ''

        for (let i = 0; i < nodeRefs.current.length - 1; i++) {
          if (!nodeRefs.current[i] || !nodeRefs.current[i + 1]) continue

          const node1 = nodeRefs.current[i]
          const node2 = nodeRefs.current[i + 1]
          
          const rect1 = node1.getBoundingClientRect()
          const rect2 = node2.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()

          // Calculate relative positions within container
          const x1 = rect1.left - containerRect.left + rect1.width / 2
          const y1 = rect1.top - containerRect.top + rect1.height / 2
          const x2 = rect2.left - containerRect.left + rect2.width / 2
          const y2 = rect2.top - containerRect.top + rect2.height / 2

          const distance = y2 - y1
          const midY = (y1 + y2) / 2

          if (i === 0) {
            pathD = `M ${x1} ${y1}`
          }

          // Create smooth S-curve connecting nodes
          pathD += ` C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
        }

        setPathData(pathD)
      } catch (err) {
        console.error('Error calculating path:', err)
      }
    }

    // Calculate path after elements render with slight delay
    const timer = setTimeout(calculatePath, 200)
    window.addEventListener('resize', calculatePath)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', calculatePath)
    }
  }, [modules, loading])

  // Setup Intersection Observer for scroll animations (runs once)
  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        // Only animate if not already animated
        if (entry.isIntersecting && !entry.target.hasAttribute('data-animated')) {
          const delay = index * 0.1
          entry.target.style.setProperty('--animation-delay', `${delay}s`)
          entry.target.classList.add('scroll-fade-in')
          entry.target.setAttribute('data-animated', 'true')
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    // Observe all scrollable elements
    const observeElements = () => {
      const pathItems = document.querySelectorAll('.s-path-item:not([data-animated])')
      const headerElements = document.querySelectorAll('.journey-header:not([data-animated]), .journey-title:not([data-animated]), .journey-subtitle:not([data-animated]), .journey-stats:not([data-animated])')
      const tipCards = document.querySelectorAll('.tip-card:not([data-animated])')
      
      pathItems.forEach((item) => observer.observe(item))
      headerElements.forEach((el) => observer.observe(el))
      tipCards.forEach((card) => observer.observe(card))
    }

    // Add small delay to ensure DOM is ready
    const timer = setTimeout(observeElements, 100)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  const handleModuleClick = async (moduleId, status) => {
    if (status !== 'locked') {
      try {
        // Fetch topics for this module
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/lesson/${moduleId}`,
          { withCredentials: true }
        )
        
        if (response.data.ok && response.data.topics && response.data.topics.length > 0) {
          const firstTopic = response.data.topics[0]
          // Navigate directly to the first topic's sentences page
          navigate(`/topic/${firstTopic.id}/sentences`)
        } else {
          // Fallback to topics list if no topics found
          navigate(`/module/${moduleId}/topics`)
        }
      } catch (err) {
        console.error('Error fetching topics:', err)
        // Fallback to topics list on error
        navigate(`/module/${moduleId}/topics`)
      }
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
            <div className="journey-header scroll-animate">
              <h1 className="journey-title scroll-animate">🗺️ Your Learning Journey</h1>
              <p className="journey-subtitle scroll-animate">Master Indian Sign Language one checkpoint at a time</p>
              <div className="journey-stats scroll-animate">
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
              {/* SVG Path Background */}
              <svg 
                ref={svgRef}
                className="journey-path-svg"
                viewBox="0 0 1000 3000"
                preserveAspectRatio="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                {modules.length > 1 && (
                  <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#39FF14" stopOpacity="0.8" />
                    </linearGradient>
                    <filter id="pathGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                )}
                {pathData && (
                  <path
                    d={pathData}
                    stroke="url(#pathGradient)"
                    strokeWidth="12"
                    fill="none"
                    filter="url(#pathGlow)"
                    className="path-line"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>

              {/* S-Path Node Grid */}
              <div className="s-path-grid">
                {modules.map((module, index) => {
                  const status = getModuleStatus(index)
                  const progress = getProgressPercentage(index)
                  const isLeft = index % 2 === 0

                  return (
                    <div 
                      key={module.id}
                      className={`s-path-item ${isLeft ? 's-left' : 's-right'} scroll-animate`}
                      ref={(el) => {
                        if (el) nodeRefs.current[index] = el
                      }}
                    >
                      {/* Vertical Line Connector */}
                      {index > 0 && <div className="node-connector"></div>}

                      {/* Module Card */}
                      <div
                        className={`module-card module-${status}`}
                        onClick={() => handleModuleClick(module.id, status)}
                        style={{ cursor: status === 'locked' ? 'not-allowed' : 'pointer' }}
                      >
                        {/* Card Header with Badge */}
                        <div className="card-header">
                          <div className="card-number">Module {index + 1}</div>
                          {status === 'completed' && <span className="status-badge completed">✓ Completed</span>}
                          {status === 'current' && <span className="status-badge current">► Current</span>}
                          {status === 'locked' && <span className="status-badge locked">🔒 Locked</span>}
                        </div>

                        {/* Progress Ring */}
                        <div className="progress-ring-container">
                          <svg className="progress-ring" viewBox="0 0 100 100">
                            <circle className="progress-bg" cx="50" cy="50" r="40"/>
                            <circle 
                              className="progress-fill" 
                              cx="50" cy="50" r="40"
                              style={{ 
                                strokeDasharray: `${(progress / 100) * 251.3} 251.3`,
                              }}
                            />
                          </svg>
                          <div className="progress-text">{progress}%</div>
                        </div>

                        {/* Card Title and Description */}
                        <h3 className="card-title">{module.title}</h3>
                        <p className="card-subtitle">{progress}% Complete</p>

                        {/* Card Actions */}
                        <div className="card-actions">
                          {status === 'current' && (
                            <button className="btn-primary">Continue Learning</button>
                          )}
                          {status === 'locked' && (
                            <button className="btn-disabled">Complete Previous</button>
                          )}
                          {status === 'completed' && (
                            <button className="btn-secondary">Review Module</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="journey-tips scroll-animate">
              <h3 className="tips-title scroll-animate">💡 Pro Tips</h3>
              <div className="tips-grid">
                <div className="tip-card scroll-animate">
                  <span className="tip-icon">🎯</span>
                  <p>Complete each module sequentially for the best learning outcome</p>
                </div>
                <div className="tip-card scroll-animate">
                  <span className="tip-icon">⏰</span>
                  <p>Spend 15-30 minutes daily on your learning journey</p>
                </div>
                <div className="tip-card scroll-animate">
                  <span className="tip-icon">🎮</span>
                  <p>Use practice mode to master signs with AI feedback</p>
                </div>
                <div className="tip-card scroll-animate">
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
