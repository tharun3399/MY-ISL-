import React, { useState, useContext, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import Sidebar from './Sidebar/Sidebar'
import DashboardContent from './DashboardContent/DashboardContent'
import axios from 'axios'
import './Dashboard.css'

export default function Dashboard() {
  const { authState } = useContext(AuthContext)
  const user = authState?.user || {}
  const navigate = useNavigate()
  const [screenSize, setScreenSize] = useState('laptop')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [allModules, setAllModules] = useState([])
  const [searchType, setSearchType] = useState('all') // 'all', 'modules', 'sentences'
  const [stats, setStats] = useState({
    dailyStreak: 0,
    totalXP: 0,
    currentGoal: 0,
    rank: 0
  })
  const searchContainerRef = useRef(null)

  // Fetch user stats from API
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user_stats`,
          { withCredentials: true }
        )
        if (response.data.stats) {
          setStats({
            dailyStreak: response.data.stats.streak_days || 0,
            totalXP: response.data.stats.xp || 0,
            currentGoal: response.data.stats.current_goal_minutes || 0,
            rank: response.data.stats.level || 0
          })
        }
      } catch (err) {
        console.error('Error fetching user stats:', err)
      }
    }
    fetchUserStats()
  }, [])

  // Fetch all modules on mount
  useEffect(() => {
    const fetchAllModules = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/lessons/modules`, 
          { withCredentials: true }
        )
        if (response.data.ok && response.data.modules) {
          console.log('All modules loaded:', response.data.modules)
          setAllModules(response.data.modules)
        }
      } catch (err) {
        console.error('Error fetching modules:', err)
      }
    }
    fetchAllModules()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setScreenSize('phone')
      } else if (window.innerWidth < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('laptop')
      }
    }

    window.addEventListener('resize', handleResize)
    // Set initial screen size
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleScreenModeChange = (mode) => {
    setManualScreenMode(mode)
    setScreenSize(mode)
  }
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    
    if (query.trim() === '') {
      setSearchResults([])
      setShowSearchDropdown(false)
    } else {
      // Search in sentences via API
      const searchSentences = async () => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/sentences/search`,
            { params: { q: query }, withCredentials: true }
          )
          
          if (response.data.ok) {
            const sentenceResults = response.data.results.map(s => ({ 
              ...s, 
              type: 'sentence',
              sentence_text: s.sentence,
              topic_name: s.topic
            }))
            setSearchResults(sentenceResults)
            console.log('Search results:', sentenceResults)
            setShowSearchDropdown(true)
          }
        } catch (err) {
          console.error('Error searching sentences:', err)
          setSearchResults([])
          setShowSearchDropdown(true)
        }
      }
      
      searchSentences()
    }
  }

  // Handle module click - navigate to that module
  const handleModuleClick = (module) => {
    navigate(`/module/${module.id}`)
    setSearchQuery('')
    setSearchResults([])
    setShowSearchDropdown(false)
  }

  // Handle sentence navigation
  const handleSentenceClick = (sentenceId, topicId) => {
    navigate(`/topic/${topicId}/sentences`)
    setSearchQuery('')
    setSearchResults([])
    setShowSearchDropdown(false)
  }

  return (
    <div className={`dashboard dashboard-${screenSize}`}>
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="dashboard-header-actions">
            <div className="search-container" ref={searchContainerRef}>
              <input 
                type="text" 
                placeholder="Search lessons..." 
                className="search-input"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setShowSearchDropdown(true)}
              />
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((result, idx) => (
                    <div 
                      key={`${result.type}-${result.id || idx}`} 
                      className={`search-result-item search-result-${result.type}`}
                      onClick={() => {
                        if (result.type === 'module') {
                          handleModuleClick(result)
                        } else if (result.type === 'sentence') {
                          handleSentenceClick(result.id, result.topic_id)
                        }
                      }}
                    >
                      <div className="search-result-badge">{result.type === 'sentence' ? '📝' : '📚'}</div>
                      <div className="search-result-content">
                        <div className="search-result-name">
                          {result.type === 'sentence' ? result.sentence_text : (result.module_name || result.title)}
                        </div>
                        <div className="search-result-module">
                          {result.type === 'sentence' ? `Topic: ${result.topic_name}` : (result.description || 'Module')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showSearchDropdown && searchResults.length === 0 && searchQuery && (
                <div className="search-dropdown">
                  <div className="search-no-results">No words/sentences found</div>
                </div>
              )}
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
