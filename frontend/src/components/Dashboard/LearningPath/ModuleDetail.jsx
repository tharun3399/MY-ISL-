import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../../context/AuthContext'
import Sidebar from '../Sidebar/Sidebar'
import axios from 'axios'
import './ModuleDetail.css'

export default function ModuleDetail() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [module, setModule] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completedTopics, setCompletedTopics] = useState({})

  useEffect(() => {
    const fetchModuleDetail = async () => {
      try {
        // Fetch module details
        const moduleResponse = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/lessons/modules/${moduleId}`, { withCredentials: true })
        if (moduleResponse.data.ok) {
          setModule(moduleResponse.data.module)

          // Fetch topics for this lesson/module using the lesson ID
          try {
            const topicsResponse = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/lesson/${moduleId}`, { withCredentials: true })
            if (topicsResponse.data.ok) {
              console.log('Topics response from API:', topicsResponse.data.topics)
              setTopics(topicsResponse.data.topics || [])
              
              // Initialize completed topics from API response
              const completedMap = {}
              topicsResponse.data.topics.forEach(topic => {
                completedMap[topic.id] = topic.completed || false
              })
              setCompletedTopics(completedMap)
            } else {
              console.warn('No topics found for this lesson')
              setTopics([])
            }
          } catch (topicsErr) {
            console.error('Error fetching topics:', topicsErr)
            setTopics([])
          }
        } else {
          setError('Failed to fetch module details')
        }
      } catch (err) {
        console.error('Error fetching module detail:', err)
        setError('Error loading module')
      } finally {
        setLoading(false)
      }
    }

    if (moduleId) {
      fetchModuleDetail()
    }
  }, [moduleId])

  const handleTopicComplete = async (topicId) => {
    const newCompletionStatus = !completedTopics[topicId]
    
    // Update UI immediately for responsiveness
    setCompletedTopics(prev => ({
      ...prev,
      [topicId]: newCompletionStatus
    }))

    // Call API to persist the change
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/progress`,
        { topicId, completed: newCompletionStatus },
        { withCredentials: true }
      )
      
      if (!response.data.ok) {
        console.error('Failed to update topic progress:', response.data.message)
        // Revert the UI change if API call fails
        setCompletedTopics(prev => ({
          ...prev,
          [topicId]: !newCompletionStatus
        }))
      }
    } catch (err) {
      console.error('Error updating topic progress:', err)
      // Revert the UI change if API call fails
      setCompletedTopics(prev => ({
        ...prev,
        [topicId]: !newCompletionStatus
      }))
    }
  }

  const getLevelColor = (level) => {
    switch(level) {
      case 'Beginner': return '#10b981'
      case 'Intermediate': return '#f59e0b'
      case 'Advanced': return '#ef4444'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return (
      <div className="module-detail-wrapper">
        <Sidebar />
        <div className="module-detail-container">
          <div className="loading-spinner">Loading module details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="module-detail-wrapper">
        <Sidebar />
        <div className="module-detail-container">
          <div className="error-message">{error}</div>
          <button className="back-btn" onClick={() => navigate('/learning-path')}>
            ← Back to Learning Path
          </button>
        </div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="module-detail-wrapper">
        <Sidebar />
        <div className="module-detail-container">
          <div className="error-message">Module not found</div>
          <button className="back-btn" onClick={() => navigate('/learning-path')}>
            ← Back to Learning Path
          </button>
        </div>
      </div>
    )
  }

  const completedCount = Object.values(completedTopics).filter(Boolean).length
  const moduleProgress = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0

  return (
    <div className="module-detail-wrapper">
      <Sidebar />
      <div className="module-detail-container">
        <button className="back-btn" onClick={() => navigate('/learning-path')}>
          ← Back to Learning Path
        </button>

        <div className="module-header">
          <div className="module-header-content">
            <span className="module-icon">{module.icon}</span>
            <div className="module-info">
              <h1 className="module-title">{module.module_name}</h1>
              <p className="module-description">{module.description}</p>
            </div>
          </div>
          <div className="module-stats">
            <div className="stat">
              <span className="stat-label">Progress</span>
              <span className="stat-value">{moduleProgress}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Topics</span>
              <span className="stat-value">{topics.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{completedCount}</span>
            </div>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${moduleProgress}%`, backgroundColor: module.color }}></div>
          </div>
          <p className="progress-text">{moduleProgress}% Complete</p>
        </div>

        <div className="lessons-section">
          <h2 className="lessons-title">Topics</h2>
          <div className="lessons-list">
            {topics.length > 0 ? (
              topics.map((topic) => (
                <div 
                  key={topic.id} 
                  className="lesson-card"
                  onClick={() => navigate(`/module/${moduleId}/topic/${topic.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="lesson-number">{topic.number}</div>
                  <div className="lesson-content">
                    <h3 className="lesson-name">{topic.topic_name}</h3>
                  </div>
                  <button
                    className={`lesson-checkbox ${completedTopics[topic.id] ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTopicComplete(topic.id)
                    }}
                  >
                    {completedTopics[topic.id] ? '✓' : ''}
                  </button>
                </div>
              ))
            ) : (
              <div className="no-topics-message">
                <p>No topics found for this lesson. Please check back later or contact support.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
