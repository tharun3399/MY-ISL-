import React, { useState, useEffect, useContext, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../../../context/AuthContext'
import Sidebar from '../../Sidebar/Sidebar'
import axios from 'axios'
import './SentencePage.css'

export default function SentencePage() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [topic, setTopic] = useState(null)
  const [sentences, setSentences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completedSentences, setCompletedSentences] = useState({})
  const [expandedSentence, setExpandedSentence] = useState(null)
  
  // Video state
  const [wordVideos, setWordVideos] = useState([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [selectedSentenceId, setSelectedSentenceId] = useState(null)
  const [showWordDisplay, setShowWordDisplay] = useState(false)
  const [videoReadyToPlay, setVideoReadyToPlay] = useState(true)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoLoadError, setVideoLoadError] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const videoRef = useRef(null)
  
  // Cloudflare URL
  const CLOUDFLARE_PUBLIC_URL = 'https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/'

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sentences for this topic
        const sentencesResponse = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/sentences/topic/${topicId}`,
          { withCredentials: true }
        )
        if (sentencesResponse.data.ok) {
          setTopic(sentencesResponse.data.topic)
          setSentences(sentencesResponse.data.sentences || [])
          
          // Initialize completed sentences
          const completedMap = {}
          sentencesResponse.data.sentences.forEach(sentence => {
            completedMap[sentence.id] = sentence.completed || false
          })
          setCompletedSentences(completedMap)
        } else {
          setSentences([])
        }
        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Error loading sentences')
        setLoading(false)
      }
    }

    if (topicId) {
      fetchData()
    }
  }, [topicId])

  const handleSentenceComplete = async (sentenceId, e) => {
    e.stopPropagation()
    const newCompletionStatus = !completedSentences[sentenceId]
    
    setCompletedSentences(prev => ({
      ...prev,
      [sentenceId]: newCompletionStatus
    }))

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/sentences/progress`,
        { sentenceId, completed: newCompletionStatus },
        { withCredentials: true }
      )
      
      if (!response.data.ok) {
        setCompletedSentences(prev => ({
          ...prev,
          [sentenceId]: !newCompletionStatus
        }))
      }
    } catch (err) {
      console.error('Error updating sentence progress:', err)
      setCompletedSentences(prev => ({
        ...prev,
        [sentenceId]: !newCompletionStatus
      }))
    }
  }

  const toggleSentenceExpand = (sentenceId) => {
    setExpandedSentence(expandedSentence === sentenceId ? null : sentenceId)
  }

  const fetchWordVideos = async (sentenceText) => {
    try {
      setIsVideoLoading(true)
      setVideoLoadError(false)
      // Show word display for first word
      setShowWordDisplay(true)
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/sentences/words/${encodeURIComponent(sentenceText)}`,
        { withCredentials: true }
      )

      if (response.data.ok) {
        setWordVideos(response.data.videos || [])
        setCurrentVideoIndex(0)
        setVideoReadyToPlay(true)
        setIsVideoLoading(false)
        // Hide word display after animation completes
        setTimeout(() => setShowWordDisplay(false), 1500)
        console.log('Fetched word videos:', response.data.videos)
      } else {
        setWordVideos([])
        setIsVideoLoading(false)
        setShowWordDisplay(false)
      }
    } catch (err) {
      console.error('Error fetching word videos:', err)
      setWordVideos([])
      setIsVideoLoading(false)
      setShowWordDisplay(false)
    }
  }

  const handleSentenceClick = (sentenceId, sentenceText) => {
    setSelectedSentenceId(sentenceId)
    setExpandedSentence(expandedSentence === sentenceId ? null : sentenceId)
    if (expandedSentence !== sentenceId) {
      setPlaybackSpeed(1)
      if (videoRef.current) {
        videoRef.current.playbackRate = 1
      }
      fetchWordVideos(sentenceText)
    }
  }

  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      setPlaybackSpeed(1)
      if (videoRef.current) {
        videoRef.current.playbackRate = 1
      }
      setVideoLoadError(false)
      setIsVideoLoading(true)
      setVideoReadyToPlay(false)
      setShowWordDisplay(true)
      setCurrentVideoIndex(currentVideoIndex - 1)
      // After animation completes, allow video to play
      setTimeout(() => {
        setShowWordDisplay(false)
        setVideoReadyToPlay(true)
      }, 1500)
    }
  }

  const handleNextVideo = () => {
    if (currentVideoIndex < wordVideos.length - 1) {
      setPlaybackSpeed(1)
      if (videoRef.current) {
        videoRef.current.playbackRate = 1
      }
      setVideoLoadError(false)
      setIsVideoLoading(true)
      setVideoReadyToPlay(false)
      setShowWordDisplay(true)
      setCurrentVideoIndex(currentVideoIndex + 1)
      // After animation completes, allow video to play
      setTimeout(() => {
        setShowWordDisplay(false)
        setVideoReadyToPlay(true)
      }, 1500)
    }
  }

  const handleVideoCanPlay = () => {
    setIsVideoLoading(false)
    setVideoLoadError(false)
    // Play video after word animation completes (1.5s total animation)
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play()
      }
    }, 1500)
  }

  const handleVideoError = () => {
    setIsVideoLoading(false)
    setVideoLoadError(true)
  }

  const handleVideoClick = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play()
    }
  }

  const handlePlaybackSpeedChange = (e) => {
    const speed = parseFloat(e.target.value)
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  const getCurrentVideoUrl = () => {
    if (wordVideos.length === 0) return null
    const video = wordVideos[currentVideoIndex]
    return `${CLOUDFLARE_PUBLIC_URL}${video.video_name}`
  }

  const getCompletionPercentage = () => {
    if (sentences.length === 0) return 0
    const completed = Object.values(completedSentences).filter(Boolean).length
    return Math.round((completed / sentences.length) * 100)
  }

  if (loading) {
    return (
      <div className="sentence-page-container">
        <Sidebar />
        <div style={{ padding: '30px' }}>
          <div style={{ textAlign: 'center', color: '#A0A0A0', marginTop: '40px' }}>
            Loading sentences...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sentence-page-container">
        <Sidebar />
        <div style={{ padding: '30px' }}>
          <div style={{ textAlign: 'center', color: '#ef4444', marginTop: '40px' }}>
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sentence-page-container">
      <Sidebar />
      <div className="sentence-content-wrapper">
        <div className="sentence-page-header">
          <button className="back-btn" onClick={() => window.history.back()}>
            ← Back to Topics
          </button>
        </div>

        <div className="sentence-main-layout">
          {/* Video Player - Left Half */}
          <div className="video-container">
            <div className="video-header">
              <h2>{topic?.title || 'Word Videos'}</h2>
            </div>
            <div className="video-player-box">
              {showWordDisplay && wordVideos.length > 0 && (
                <div className="word-display-overlay">
                  <div className="word-display-text">
                    {wordVideos[currentVideoIndex]?.word_name}
                  </div>
                </div>
              )}
              {wordVideos.length === 0 ? (
                <div className="video-placeholder">
                  <div className="placeholder-icon">▶</div>
                  <p>Select a sentence</p>
                  <p className="placeholder-subtitle">Click any sentence to see word videos</p>
                </div>
              ) : (
                <div className="word-video-section">
                  <div className="video-display">
                    {isVideoLoading && !videoLoadError && (
                      <div className="video-loading">
                        <div className="spinner"></div>
                        <p>Loading video...</p>
                      </div>
                    )}
                    {videoLoadError && (
                      <div className="video-error">
                        <div className="error-icon">⚠</div>
                        <p>Video not available</p>
                      </div>
                    )}
                    {videoReadyToPlay && !videoLoadError && (
                      <video 
                        ref={videoRef}
                        key={getCurrentVideoUrl()}
                        src={getCurrentVideoUrl()} 
                        className="video-element"
                        onClick={handleVideoClick}
                        onCanPlay={handleVideoCanPlay}
                        onError={handleVideoError}
                      />
                    )}
                  </div>

                  <div className="video-controls">
                    <button 
                      className="nav-btn prev-btn"
                      onClick={handlePrevVideo}
                      disabled={currentVideoIndex === 0}
                      title="Previous word"
                    >
                      ← Previous
                    </button>

                    <div className="video-progress">
                      <span className="progress-text">
                        {wordVideos[currentVideoIndex]?.word_name}
                      </span>
                      <span className="progress-count">
                        {currentVideoIndex + 1} of {wordVideos.length}
                      </span>
                    </div>

                    <button 
                      className="nav-btn next-btn"
                      onClick={handleNextVideo}
                      disabled={currentVideoIndex === wordVideos.length - 1}
                      title="Next word"
                    >
                      Next →
                    </button>
                  </div>

                  <div className="speed-control">
                    <label htmlFor="speed-slider" className="speed-label">
                      Speed: {playbackSpeed.toFixed(2)}x
                    </label>
                    <input
                      id="speed-slider"
                      type="range"
                      min="0.25"
                      max="2"
                      step="0.25"
                      value={playbackSpeed}
                      onChange={handlePlaybackSpeedChange}
                      className="speed-slider"
                    />
                  </div>

                  <div className="progress-dots">
                    {wordVideos.map((_, idx) => (
                      <button
                        key={idx}
                        className={`dot ${idx === currentVideoIndex ? 'active' : ''}`}
                        onClick={() => setCurrentVideoIndex(idx)}
                        title={`Jump to word ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sentences List - Right Half */}
          <div className="sentences-container">
            <div className="sentences-header">
              <h2>Sentences <span className="count-badge">{sentences.length}</span></h2>
            </div>
            
            {sentences.length === 0 ? (
              <div className="no-sentences-state">
                <p>No sentences available for this topic yet.</p>
              </div>
            ) : (
              <div className="sentences-list">
                {sentences.map((sentence, index) => (
                  <div
                    key={sentence.id}
                    className={`sentence-item ${completedSentences[sentence.id] ? 'completed' : ''} ${selectedSentenceId === sentence.id ? 'active' : ''}`}
                    onClick={() => handleSentenceClick(sentence.id, sentence.sentence)}
                  >
                    <div className="sentence-index">{index + 1}</div>
                    
                    <div className="sentence-body">
                      <p className="sentence-main">{sentence.sentence}</p>
                      {expandedSentence === sentence.id && (
                        <div className="sentence-details">
                          {sentence.meaning && <p><strong>Meaning:</strong> {sentence.meaning}</p>}
                          {sentence.usage && <p><strong>Usage:</strong> {sentence.usage}</p>}
                        </div>
                      )}
                    </div>

                    <button
                      className={`mark-complete ${completedSentences[sentence.id] ? 'done' : ''}`}
                      onClick={(e) => handleSentenceComplete(sentence.id, e)}
                      title={completedSentences[sentence.id] ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {completedSentences[sentence.id] ? '✓' : ''}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
