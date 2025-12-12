import React, { useState, useContext, useEffect } from 'react'
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

  // Fetch modules from API on component mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/lessons/modules`, { withCredentials: true })
        if (response.data.ok) {
          const modulesData = response.data.modules.map(module => ({
            ...module,
            title: module.module_name
          }))
          setModules(modulesData)
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

  const handleModuleClick = (moduleId) => {
    navigate(`/module/${moduleId}`)
  }

  const getLevelColor = (level) => {
    switch(level) {
      case 'Beginner': return '#10b981'
      case 'Intermediate': return '#f59e0b'
      case 'Advanced': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <div className="learning-path-wrapper">
      <Sidebar />
      <div className="learning-path-container">
        {loading && <div className="loading-spinner">Loading modules...</div>}
        {error && <div className="error-message">Error: {error}</div>}
        {!loading && !error && (
          <>
            <div className="learning-path-header">
              <div className="path-header-content">
                <h1 className="path-title">Learning Path</h1>
                <p className="path-subtitle">Master Indian Sign Language with our structured curriculum</p>
                <div className="path-stats">
                  <div className="stat-card">
                    <span className="stat-label">Overall Progress</span>
                    <span className="stat-value">0%</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Modules</span>
                    <span className="stat-value">{modules.length}</span>
                  </div>
                </div>
              </div>
              <div className="path-header-visual">
                <div className="progress-circle" style={{ '--progress': `0deg` }}>
                  <div className="progress-circle-inner">
                    <div className="progress-percentage">0%</div>
                    <div className="progress-label">Complete</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modules-grid">
              {modules.map(module => (
                <div 
                  key={module.id} 
                  className="module-card" 
                  onClick={() => handleModuleClick(module.id)}
                  style={{ cursor: 'pointer', borderTopColor: module.color }}
                >
                  <div className="module-header">
                    <div className="module-header-left">
                      <span className="module-icon">{module.icon}</span>
                      <div className="module-info">
                        <h3 className="module-title">{module.title}</h3>
                        <p className="module-description">{module.description}</p>
                      </div>
                    </div>
                    <div className="module-header-right">
                      <div className="module-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.max(module.progress, 2)}%`, backgroundColor: module.color }}></div>
                        </div>
                        <span className="progress-text">{module.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="learning-tips">
              <h3 className="tips-title">💡 Learning Tips</h3>
              <ul className="tips-list">
                <li className="tip-item">Practice regularly for 15-30 minutes daily for best results</li>
                <li className="tip-item">Use the practice mode with AI camera for real-time feedback</li>
                <li className="tip-item">Review completed lessons to reinforce your learning</li>
                <li className="tip-item">Join the community to learn from other students</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
