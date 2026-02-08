import React, { useState, useEffect, useContext, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../../../context/AuthContext'
import Quiz from '../Quiz/Quiz'
import axios from 'axios'
import { mergeVideosOnBackend } from '../../../../utils/videoMerger'
import './SentencePage.css'

export default function SentencePage() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [topic, setTopic] = useState(null)
  const [sentences, setSentences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lessonId, setLessonId] = useState(null)
  const [allTopicsInLesson, setAllTopicsInLesson] = useState([])
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
  const [autoPlayAll, setAutoPlayAll] = useState(false)
  const videoRef = useRef(null)
  
  // Merged video state
  const [showMergedView, setShowMergedView] = useState(false)
  const [mergedVideoUrl, setMergedVideoUrl] = useState(null)
  const [mergedVideoUrls, setMergedVideoUrls] = useState([])
  const [isMergingVideo, setIsMergingVideo] = useState(false)
  const [currentMergedSentenceIndex, setCurrentMergedSentenceIndex] = useState(null)
  const [currentMergedVideoIndex, setCurrentMergedVideoIndex] = useState(0)
  const mergedVideoRef = useRef(null)
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false)
  const [allSentencesCompleted, setAllSentencesCompleted] = useState(false)
  
  // Solution state
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [solutionChoices, setSolutionChoices] = useState([])
  
  // Cloudflare URL
  const CLOUDFLARE_PUBLIC_URL = 'https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/'

  // Get solution choices - extract words from sentences
  const generateSolutionChoices = () => {
    if (sentences.length === 0 || wordVideos.length === 0) return []
    
    const correctAnswer = wordVideos[0]?.word_name || ''
    const choices = new Set([correctAnswer])
    
    // Get current sentence index
    const currentSentenceIndex = sentences.findIndex(s => s.id === selectedSentenceId)
    
    // Extract words from current sentence and adjacent sentences
    const sentencesToCheck = []
    if (currentSentenceIndex > 0) sentencesToCheck.push(sentences[currentSentenceIndex - 1])
    if (currentSentenceIndex >= 0) sentencesToCheck.push(sentences[currentSentenceIndex])
    if (currentSentenceIndex < sentences.length - 1) sentencesToCheck.push(sentences[currentSentenceIndex + 1])
    
    // Extract words from sentences
    sentencesToCheck.forEach(sentence => {
      const words = sentence.sentence.split(/\s+/).filter(word => word.length > 0)
      words.forEach(word => {
        if (choices.size < 4) {
          // Remove punctuation and convert to lowercase for comparison
          const cleanWord = word.replace(/[.,!?;:]/g, '')
          if (cleanWord.toLowerCase() !== correctAnswer.toLowerCase()) {
            choices.add(cleanWord)
          }
        }
      })
    })
    
    // Convert to array and shuffle
    const choicesArray = Array.from(choices).slice(0, 4)
    return choicesArray.sort(() => Math.random() - 0.5)
  }

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
          
          // Get lesson ID from topic
          const fetchedLessonId = sentencesResponse.data.topic?.lesson_id
          if (fetchedLessonId) {
            setLessonId(fetchedLessonId)
            
            // Fetch all topics in this lesson to enable auto-navigation
            try {
              const topicsResponse = await axios.get(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/lesson/${fetchedLessonId}`,
                { withCredentials: true }
              )
              if (topicsResponse.data.ok && topicsResponse.data.topics) {
                setAllTopicsInLesson(topicsResponse.data.topics)
              }
            } catch (topicErr) {
              console.log('Could not fetch all topics for lesson:', topicErr)
            }
          }
          
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

  // Generate solution choices when sentence or word videos change
  useEffect(() => {
    const choices = generateSolutionChoices()
    setSolutionChoices(choices)
    setSelectedChoice(null)
    setIsAnswered(false)
    setIsCorrect(false)
  }, [selectedSentenceId, wordVideos])

  // Check if all sentences are completed
  useEffect(() => {
    if (sentences.length > 0) {
      const allCompleted = sentences.every(sentence => completedSentences[sentence.id])
      setAllSentencesCompleted(allCompleted)
      
      // Auto-show quiz when all sentences are completed
      if (allCompleted && !showQuiz) {
        setShowQuiz(true)
      }
    }
  }, [completedSentences, sentences, showQuiz])

  // Auto-play first sentence's word video when page loads
  useEffect(() => {
    if (sentences.length > 0 && !selectedSentenceId) {
      const firstSentence = sentences[0]
      // Delay to ensure fetchWordVideos is defined
      setTimeout(() => {
        setSelectedSentenceId(firstSentence.id)
        setAutoPlayAll(true)
        fetchWordVideos(firstSentence.sentence)
      }, 100)
    }
  }, [sentences])

  // Removed auto-play logic - videos only play on user click

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
      setAutoPlayAll(false)
      fetchWordVideos(sentenceText)
    }
  }

  const handlePrevVideo = () => {
    // Find current sentence index
    const currentSentenceIndex = sentences.findIndex(s => s.id === selectedSentenceId)
    if (currentSentenceIndex > 0) {
      const prevSentence = sentences[currentSentenceIndex - 1]
      handleSentenceClick(prevSentence.id, prevSentence.sentence)
    }
  }

  const handleNextVideo = () => {
    // Check if we're at the last word video
    const isLastWord = currentVideoIndex === wordVideos.length - 1
    
    // Check if current answer is answered
    const isCurrentAnswered = isAnswered
    
    if (isLastWord && isCurrentAnswered) {
      // All words in sentence are done, trigger merge for next view
      const currentSentenceIndex = sentences.findIndex(s => s.id === selectedSentenceId)
      if (currentSentenceIndex >= 0 && currentSentenceIndex < sentences.length) {
        triggerVideoMerge(currentSentenceIndex)
      }
    } else if (currentVideoIndex < wordVideos.length - 1) {
      // Move to next word video
      setCurrentVideoIndex(currentVideoIndex + 1)
      setSelectedChoice(null)
      setIsAnswered(false)
      setIsCorrect(false)
    }
  }

  const handleVideoCanPlay = () => {
    setIsVideoLoading(false)
    setVideoLoadError(false)
    // Apply the current playback speed to the video
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed
    }
    // Don't auto-play - let user click play button
  }

  const handleVideoError = () => {
    setIsVideoLoading(false)
    setVideoLoadError(true)
    
    // If autoPlayAll is enabled, skip to next video after 1 second
    if (autoPlayAll && currentVideoIndex < wordVideos.length - 1) {
      setTimeout(() => {
        setVideoLoadError(false)
        setIsVideoLoading(true)
        setVideoReadyToPlay(false)
        setShowWordDisplay(true)
        setCurrentVideoIndex(currentVideoIndex + 1)
        setTimeout(() => {
          setShowWordDisplay(false)
          setVideoReadyToPlay(true)
        }, 1500)
      }, 1000)
    }
  }

  const handleVideoClick = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      // Reset autoPlayAll so next video doesn't auto-play
      setAutoPlayAll(false)
      videoRef.current.play().catch(err => console.log('Video play failed:', err))
    }
  }

  const handleVideoEnded = () => {
    // Do nothing when video ends - user must manually click next video
  }

  const triggerVideoMerge = async (sentenceIndex) => {
    try {
      setIsMergingVideo(true)
      const currentSentence = sentences[sentenceIndex]
      
      if (!currentSentence || !wordVideos || wordVideos.length === 0) {
        setIsMergingVideo(false)
        return
      }

      // Prepare video URLs in sentence word order
      const videoUrls = wordVideos
        .filter(video => video && video.video_name)
        .map(video => `https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/${video.video_name}`)

      if (videoUrls.length === 0) {
        setIsMergingVideo(false)
        return
      }

      // Store the original word video URLs as fallback
      setMergedVideoUrls(videoUrls)
      setCurrentMergedVideoIndex(0)

      // Call backend to merge videos
      const result = await mergeVideosOnBackend(
        videoUrls,
        currentSentence.sentence,
        import.meta.env.VITE_API_URL || 'http://localhost:5000'
      )

      if (result.success && result.merged) {
        console.log('Merge result:', result.merged)
        
        // Prepare video URLs
        let mergedUrl = null
        let playlistUrls = videoUrls // Default fallback
        
        // Check the playback type
        if (result.merged.playbackType === 'merged_file' && result.merged.videoUrls && result.merged.videoUrls.length > 0) {
          // FFmpeg successfully merged multiple videos
          mergedUrl = result.merged.videoUrls[0]
          console.log('✅ Using merged video file:', mergedUrl)
        } else if (result.merged.playbackType === 'single_video' && result.merged.videoUrls && result.merged.videoUrls.length > 0) {
          // Only one video available, play it directly
          mergedUrl = result.merged.videoUrls[0]
          console.log('ℹ️ Playing single available video:', mergedUrl)
        } else if (result.merged.videoUrls && result.merged.videoUrls.length > 0) {
          // Sequential playback mode - use returned video URLs (already verified as available)
          playlistUrls = result.merged.videoUrls
          mergedUrl = playlistUrls[0]
          console.log(`⚠️ Using ${result.merged.playbackType === 'sequential_fallback' ? 'fallback' : 'sequential'} playback with ${playlistUrls.length} available videos`)
        } else {
          // No URLs returned - use original word video URLs
          playlistUrls = videoUrls
          mergedUrl = playlistUrls[0]
          console.log('⚠️ Using word videos in sequence:', playlistUrls.length, 'videos')
        }
        
        setMergedVideoUrls(playlistUrls)
        setMergedVideoUrl(mergedUrl)
        setCurrentMergedSentenceIndex(sentenceIndex)
        setShowMergedView(true)
        
        // Wait for video element to render, then load and play
        setTimeout(() => {
          if (mergedVideoRef.current) {
            mergedVideoRef.current.load()
            const playPromise = mergedVideoRef.current.play()
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                console.log('Video play deferred - waiting for user interaction')
              })
            }
          }
        }, 300)
      }
      
      setIsMergingVideo(false)
    } catch (err) {
      console.error('Error merging videos:', err)
      setIsMergingVideo(false)
    }
  }

  const handleMergedVideoClick = () => {
    if (mergedVideoRef.current) {
      mergedVideoRef.current.currentTime = 0
      mergedVideoRef.current.play().catch(err => console.log('Video play failed:', err))
    }
  }

  const handleMergedVideoEnded = () => {
    // If using sequential playback (FFmpeg not available), advance to next word
    if (mergedVideoUrls.length > 1 && currentMergedVideoIndex < mergedVideoUrls.length - 1) {
      setCurrentMergedVideoIndex(currentMergedVideoIndex + 1)
      setMergedVideoUrl(mergedVideoUrls[currentMergedVideoIndex + 1])
      setTimeout(() => {
        if (mergedVideoRef.current) {
          mergedVideoRef.current.play().catch(err => console.log('Video play failed:', err))
        }
      }, 100)
    }
  }

  const handleMergedVideoNext = () => {
    const nextSentenceIndex = currentMergedSentenceIndex + 1
    
    if (nextSentenceIndex < sentences.length) {
      // Move to next sentence
      const nextSentence = sentences[nextSentenceIndex]
      handleSentenceClick(nextSentence.id, nextSentence.sentence)
      setShowMergedView(false)
      setMergedVideoUrl(null)
      setCurrentMergedVideoIndex(0)
    } else {
      // All sentences completed, show quiz
      setShowMergedView(false)
      setMergedVideoUrl(null)
      setCurrentMergedVideoIndex(0)
      setShowQuiz(true)
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
    if (wordVideos.length === 0 || currentVideoIndex >= wordVideos.length) return null
    const video = wordVideos[currentVideoIndex]
    if (!video) return null
    return `${CLOUDFLARE_PUBLIC_URL}${video.video_name}`
  }

  const getCompletionPercentage = () => {
    if (sentences.length === 0) return 0
    const completed = Object.values(completedSentences).filter(Boolean).length
    return Math.round((completed / sentences.length) * 100)
  }

  const handleQuizComplete = (quizResult) => {
    // Mark topic as completed
    handleTopicProgress(true)
    // Close quiz and show success message
    setShowQuiz(false)
    // Optionally navigate back or show completion message
    setTimeout(() => {
      navigate(-1) // Go back to topics
    }, 2000)
  }

  const handleQuizSkip = () => {
    setShowQuiz(false)
    // Still mark topic as completed even if quiz is skipped
    handleTopicProgress(true)
  }

  const handleTopicProgress = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/progress`,
        { topicId, completed: true },
        { withCredentials: true }
      )
    } catch (err) {
      console.error('Error marking topic as complete:', err)
    }
  }

  const handleChoiceSelect = (choice) => {
    if (isAnswered) return
    
    const correctAnswer = wordVideos[0]?.word_name || 'Gesture'
    // Normalize both for comparison: remove punctuation, convert to lowercase, trim whitespace
    const normalizedChoice = choice.toLowerCase().trim()
    const normalizedCorrect = correctAnswer.toLowerCase().trim().replace(/[.,!?;:]/g, '')
    
    const isCorrectChoice = normalizedChoice === normalizedCorrect
    
    setSelectedChoice(choice)
    setIsAnswered(true)
    setIsCorrect(isCorrectChoice)
  }

  if (loading) {
    return (
      <div className="sentence-page-container">
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
      {/* Merged Video View */}
      {showMergedView && mergedVideoUrl && (
        <div className="sentence-content-wrapper">
          <div className="sentence-page-header">
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#00E5FF', margin: '0', flex: '1' }}>
              Sentence Video: {sentences[currentMergedSentenceIndex]?.sentence || 'Sentence'}
            </h2>
            <button className="back-btn" onClick={() => setShowMergedView(false)}>
              ← Back to Words
            </button>
          </div>

          <div className="sentence-main-layout">
            <div className="gesture-question-section">
              <h3>Full Sentence Video</h3>
            </div>
            
            {/* Merged Video Player */}
            <div className="video-container">
              {mergedVideoUrl && (
                <video 
                  ref={mergedVideoRef}
                  src={mergedVideoUrl} 
                  className="video-element"
                  onClick={handleMergedVideoClick}
                  onEnded={handleMergedVideoEnded}
                  onLoadedData={() => console.log('✅ Merged video loaded successfully')}
                  onError={(e) => {
                    console.error('❌ Merged video error:', e.target.error)
                    // If merged video fails, fall back to sequential playback
                    if (mergedVideoUrls.length > 0) {
                      console.log('⚠️ Falling back to sequential playback')
                      setMergedVideoUrl(mergedVideoUrls[0])
                      setCurrentMergedVideoIndex(0)
                    }
                  }}
                />
              )}
              {isMergingVideo && (
                <div style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  color: '#00d9ff',
                  fontSize: '16px',
                  textAlign: 'center'
                }}>
                  <div>Merging videos...</div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>Preparing full sentence video</div>
                </div>
              )}
            </div>

            {/* Navigation for Merged Video */}
            <div className="navigation-buttons">
              <button 
                className="nav-button next-button"
                onClick={handleMergedVideoNext}
                style={{ width: '100%' }}
              >
                {currentMergedSentenceIndex < sentences.length - 1 ? 'Next Sentence →' : 'Complete & Quiz →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Word Choice View */}
      {!showMergedView && (
        <div className="sentence-content-wrapper">
          <div className="sentence-page-header">
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#00E5FF', margin: '0', flex: '1' }}>
              {topic?.title || 'Sentences'}
            </h2>
            <button className="back-btn" onClick={() => window.history.back()}>
              ← Back to Topics
            </button>
          </div>

          <div className="sentence-main-layout">
            <div className="gesture-question-section">
              <h3>Guess the Gesture ? </h3>
            </div>
            
            {/* Video Player */}
            <div className="video-container">
              {getCurrentVideoUrl() && (
                <video 
                  ref={videoRef}
                  key={getCurrentVideoUrl()}
                  src={getCurrentVideoUrl()} 
                  className="video-element"
                  onClick={handleVideoClick}
                  onCanPlay={handleVideoCanPlay}
                  onError={handleVideoError}
                  onEnded={handleVideoEnded}
                />
              )}
            </div>

            {/* Solution Section */}
            <div className="solution-section">
              <div className="choices-grid">
                {solutionChoices.map((choice, index) => (
                  <button
                    key={index}
                    className={`choice-btn ${selectedChoice === choice ? (isCorrect ? 'correct' : 'incorrect') : ''} ${isAnswered ? 'answered' : ''}`}
                    onClick={() => handleChoiceSelect(choice)}
                    disabled={isAnswered}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="navigation-buttons">
              <button 
                className="nav-button prev-button"
                onClick={handlePrevVideo}
                disabled={sentences.length === 0 || sentences.findIndex(s => s.id === selectedSentenceId) === 0}
              >
                ← Previous
              </button>
              <button 
                className="nav-button next-button"
                onClick={handleNextVideo}
                disabled={isMergingVideo || sentences.length === 0 || !isAnswered}
              >
                {currentVideoIndex === wordVideos.length - 1 && isAnswered
                  ? isMergingVideo ? 'Merging Videos...' : 'View Sentence →'
                  : !isAnswered ? 'Answer First' : 'Next Word →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal-container">
            <button 
              className="quiz-modal-close"
              onClick={handleQuizSkip}
              title="Skip quiz"
            >
              ×
            </button>
            <Quiz 
              topicId={topicId}
              onComplete={handleQuizComplete}
              onSkip={handleQuizSkip}
            />
          </div>
        </div>
      )}
    </div>
  )
}
