import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../../../context/AuthContext'
import Sidebar from '../../Sidebar/Sidebar'
import axios from 'axios'
import './TopicsPage.css'

export default function TopicsPage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [module, setModule] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completedTopics, setCompletedTopics] = useState({})
  const [expandedTopic, setExpandedTopic] = useState(null)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        // Fetch module details
        const moduleResponse = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/lessons/modules/${moduleId}`,
          { withCredentials: true }
        )
        if (moduleResponse.data.ok) {
          setModule(moduleResponse.data.module)

          // Fetch topics for this module
          try {
            const topicsResponse = await axios.get(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/lesson/${moduleId}`,
              { withCredentials: true }
            )
            if (topicsResponse.data.ok) {
              setTopics(topicsResponse.data.topics || [])
              
              // Initialize completed topics
              const completedMap = {}
              topicsResponse.data.topics.forEach(topic => {
                completedMap[topic.id] = topic.completed || false
              })
              setCompletedTopics(completedMap)
            } else {
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
        console.error('Error fetching data:', err)
        setError('Error loading topics')
      } finally {
        setLoading(false)
      }
    }

    if (moduleId) {
      fetchTopics()
    }
  }, [moduleId])

  const handleTopicClick = (topicId) => {
    navigate(`/topic/${topicId}/sentences`)
  }

  const handleTopicComplete = async (topicId, e) => {
    e.stopPropagation()
    const newCompletionStatus = !completedTopics[topicId]
    
    setCompletedTopics(prev => ({
      ...prev,
      [topicId]: newCompletionStatus
    }))

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/progress`,
        { topicId, completed: newCompletionStatus },
        { withCredentials: true }
      )
      
      if (!response.data.ok) {
        setCompletedTopics(prev => ({
          ...prev,
          [topicId]: !newCompletionStatus
        }))
      }
    } catch (err) {
      console.error('Error updating topic progress:', err)
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
      case 'Expert': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const getLevelBgColor = (level) => {
    switch(level) {
      case 'Beginner': return 'rgba(16, 185, 129, 0.1)'
      case 'Intermediate': return 'rgba(245, 158, 11, 0.1)'
      case 'Advanced': return 'rgba(239, 68, 68, 0.1)'
      case 'Expert': return 'rgba(139, 92, 246, 0.1)'
      default: return 'rgba(107, 114, 128, 0.1)'
    }
  }

  const getCompletionPercentage = () => {
    if (topics.length === 0) return 0
    const completed = Object.values(completedTopics).filter(Boolean).length
    return Math.round((completed / topics.length) * 100)
  }

  if (loading) {
    return (
      <div className="topics-page-container">
        <Sidebar />
        <div className="topics-main-content">
          <div className="loading-spinner">Loading topics...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="topics-page-container">
        <Sidebar />
        <div className="topics-main-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="topics-page-container">
      <Sidebar />
      <div className="topics-main-content">
        <div className="topics-header">
          <button className="back-button" onClick={() => navigate('/learning-path')}>
            ← Back to Learning Path
          </button>
          {module && (
            <div className="module-info">
              <h1 className="module-title">{module.title}</h1>
              {module.description && (
                <p className="module-description">{module.description}</p>
              )}
            </div>
          )}
        </div>

        <div className="topics-progress">
          <div className="progress-header">
            <h3>Your Progress</h3>
            <span className="progress-percentage">{getCompletionPercentage()}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {Object.values(completedTopics).filter(Boolean).length} of {topics.length} topics completed
          </p>
        </div>

        <div className="topics-list">
          <h2 className="topics-heading">Topics in This Module</h2>
          {topics.length === 0 ? (
            <div className="no-topics">No topics available for this module</div>
          ) : (
            <div className="topics-grid">
              {topics.map((topic, index) => (
                <div
                  key={topic.id}
                  className={`topic-card ${completedTopics[topic.id] ? 'completed' : ''}`}
                  onClick={() => handleTopicClick(topic.id)}
                >
                  <div className="topic-number">{index + 1}</div>
                  
                  <div className="topic-content">
                    <div className="topic-header-row">
                      <h3 className="topic-title">{topic.topic}</h3>
                      <button
                        className={`complete-button ${completedTopics[topic.id] ? 'completed' : ''}`}
                        onClick={(e) => handleTopicComplete(topic.id, e)}
                        title={completedTopics[topic.id] ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {completedTopics[topic.id] ? '✓' : '○'}
                      </button>
                    </div>

                    <div className="topic-meta">
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="topics-footer">
          <button 
            className="primary-button"
            onClick={() => topics.length > 0 && handleTopicClick(topics[0].id)}
            disabled={topics.length === 0}
          >
            Start Learning
          </button>
          <button 
            className="secondary-button"
            onClick={() => navigate('/learning-path')}
          >
            Back to Modules
          </button>
        </div>
      </div>
    </div>
  )
}
