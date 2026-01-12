import React, { useState, useEffect, useContext, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../../context/AuthContext'
import Sidebar from '../Sidebar/Sidebar'
import VideoSequencePlayer from './VideoSequencePlayer'
import axios from 'axios'
import { extractVideoUrls, mergeVideosOnBackend, setupSequentialPlayer } from '../../../utils/videoMerger'
import './TopicDetail.css'

export default function TopicDetail() {
  const { topicId, moduleId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [topic, setTopic] = useState(null)
  const [module, setModule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [wordVideos, setWordVideos] = useState([]) // Videos from isl_words table
  const [currentWordVideoIndex, setCurrentWordVideoIndex] = useState(0) // Current video index
  const [words, setWords] = useState([]) // Extracted words from topic
  const [failedVideoIndices, setFailedVideoIndices] = useState(new Set()) // Track videos that fail to load
  const [mergedPlaylist, setMergedPlaylist] = useState(null) // Merged video playlist
  const [playlistLoading, setPlaylistLoading] = useState(false) // Loading state for playlist creation
  const [playlistSummary, setPlaylistSummary] = useState(null) // Summary of merged playlist
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // Playback speed (0.5x to 2x)
  const mergedVideoRef = useRef(null) // Reference to merged video element
  const playlistControllerRef = useRef(null) // Reference to playlist controller
  // Cloudflare R2 public URL - videos are stored with full paths in database
  // Example: video_name can be "hello.mp4" or "Animated/hello.mp4" or "First_R2/hello.mp4"
  const CLOUDFLARE_PUBLIC_URL = 'https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/'

  useEffect(() => {
    const fetchTopicDetail = async () => {
      try {
        // Fetch module details
        const moduleResponse = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/lessons/modules/${moduleId}`,
          { withCredentials: true }
        )
        if (moduleResponse.data.ok) {
          setModule(moduleResponse.data.module)
        }

        // Fetch topics for this lesson to find the specific topic
        const topicsResponse = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/lesson/${moduleId}`,
          { withCredentials: true }
        )
        
        if (topicsResponse.data.ok && topicsResponse.data.topics) {
          const foundTopic = topicsResponse.data.topics.find(t => t.id === parseInt(topicId))
          if (foundTopic) {
            console.log('Found topic:', foundTopic)
            console.log('Video name from API:', foundTopic.video_name)
            setTopic(foundTopic)
            setIsCompleted(foundTopic.completed || false)
            
            // Construct video URL if video_name exists
            if (foundTopic.video_name) {
              const fullVideoUrl = `${CLOUDFLARE_PUBLIC_URL}${foundTopic.video_name}`
              console.log('Constructed video URL:', fullVideoUrl)
              setVideoUrl(fullVideoUrl)
            } else {
              console.log('No video_name found in topic data')
            }

            // Fetch word videos from isl_words table
            try {
              const wordVideosResponse = await axios.get(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/words/${encodeURIComponent(foundTopic.topic_name)}`,
                { withCredentials: true }
              )
              
              if (wordVideosResponse.data.ok) {
                console.log('Word videos response:', wordVideosResponse.data)
                // Only set word videos if there are any
                if (wordVideosResponse.data.videos && wordVideosResponse.data.videos.length > 0) {
                  console.log('Fetched word videos:', wordVideosResponse.data.videos)
                  console.log('Video details:', wordVideosResponse.data.videos.map(v => ({ word: v.word_name, video: v.video_name })))
                  setWordVideos(wordVideosResponse.data.videos)
                  setWords(wordVideosResponse.data.words)
                  setCurrentWordVideoIndex(0) // Start with first word video
                } else {
                  console.log('No word videos found for this topic:', wordVideosResponse.data.message)
                  setWordVideos([])
                  setWords(wordVideosResponse.data.words || [])
                }
              } else {
                console.log('Failed to fetch word videos:', wordVideosResponse.data.message)
                setWordVideos([])
              }
            } catch (wordErr) {
              console.warn('Error fetching word videos:', wordErr.message)
              // Don't treat word video fetch errors as fatal - the topic video is still there
              setWordVideos([])
              setWords([])
            }
          } else {
            setError('Topic not found')
          }
        } else {
          setError('Failed to fetch topics')
        }
      } catch (err) {
        console.error('Error fetching topic detail:', err)
        setError('Error loading topic')
      } finally {
        setLoading(false)
      }
    }

    if (topicId && moduleId) {
      fetchTopicDetail()
    }
  }, [topicId, moduleId])

  // Create merged playlist when word videos are loaded
  useEffect(() => {
    const createPlaylist = async () => {
      if (!wordVideos || wordVideos.length === 0) {
        setMergedPlaylist(null)
        setPlaylistSummary(null)
        return
      }

      setPlaylistLoading(true)
      try {
        console.log('\n📹 PREPARING VIDEOS FOR MERGE')
        console.log(`Step 1: Fetched ${wordVideos.length} videos from API`)
        
        // Extract working video URLs
        const videoUrls = extractVideoUrls(wordVideos)
        console.log(`Step 2: Extracted ${videoUrls.length} working URLs`)
        
        if (videoUrls.length === 0) {
          console.warn('❌ No working video URLs found')
          setMergedPlaylist(null)
          setPlaylistSummary('No videos available to merge')
          return
        }
        
        // Send to backend for merging
        console.log(`Step 3: Sending ${videoUrls.length} videos to backend for merging...`)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const mergeResult = await mergeVideosOnBackend(videoUrls, topic.topic_name, apiUrl)
        
        if (!mergeResult.success) {
          console.error('❌ Backend merge failed:', mergeResult.error)
          setPlaylistSummary(`Merge failed: ${mergeResult.error}`)
          return
        }
        
        console.log(`Step 4: Backend merge successful, ${mergeResult.totalVideos} videos ready`)
        
        // Create playlist data structure
        const playlistData = {
          availableVideos: mergeResult.videoUrls.map((url, idx) => {
            // Convert relative URLs to absolute URLs
            const absoluteUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`
            return {
              index: idx,
              word: wordVideos[idx]?.word_name || `Video ${idx + 1}`,
              url: absoluteUrl,
              src: absoluteUrl
            }
          }),
          totalAvailable: mergeResult.totalVideos,
          totalRequested: wordVideos.length,
          failedVideos: []
        }
        
        setMergedPlaylist(playlistData)
        setPlaylistSummary(`✅ ${playlistData.totalAvailable} videos merged and ready to play`)
        
      } catch (error) {
        console.error('Error in playlist creation:', error)
        setPlaylistSummary(`Error: ${error.message}`)
      } finally {
        setPlaylistLoading(false)
      }
    }

    createPlaylist()
  }, [wordVideos, topic])

  // Setup player when merged playlist and ref are both ready
  useEffect(() => {
    if (!mergedPlaylist || mergedPlaylist.availableVideos.length === 0) {
      return
    }
    
    if (!mergedVideoRef.current) {
      console.log('Waiting for video ref to be mounted...')
      return
    }
    
    console.log('📍 Video ref is now ready, setting up player...')
    console.log('Available videos for player:', mergedPlaylist.availableVideos.length)
    
    const playlistSources = mergedPlaylist.availableVideos.map(v => ({
      src: v.url,
      type: 'video/mp4',
      title: v.word
    }))
    
    const controller = setupSequentialPlayer(
      mergedVideoRef.current,
      playlistSources,
      (videoInfo) => {
        if (videoInfo.isComplete) {
          console.log(`✅ Playlist complete!`)
        } else {
          console.log(`▶️ Now playing: ${videoInfo.title} (${videoInfo.index + 1}/${videoInfo.total})`)
        }
      }
    )
    
    playlistControllerRef.current = controller
    console.log('✅ Player setup complete and ready to play!')
  }, [mergedPlaylist, mergedVideoRef])

  const handleMarkComplete = async () => {
    const newCompletionStatus = !isCompleted
    
    setIsCompleted(newCompletionStatus)

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/progress`,
        { topicId: parseInt(topicId), completed: newCompletionStatus },
        { withCredentials: true }
      )
      
      if (!response.data.ok) {
        console.error('Failed to update topic progress:', response.data.message)
        setIsCompleted(!newCompletionStatus)
      }
    } catch (err) {
      console.error('Error updating topic progress:', err)
      setIsCompleted(!newCompletionStatus)
    }
  }

  // Navigate to previous word video
  const handlePrevWordVideo = () => {
    if (currentWordVideoIndex > 0) {
      setCurrentWordVideoIndex(currentWordVideoIndex - 1)
    }
  }

  // Navigate to next word video
  const handleNextWordVideo = () => {
    if (currentWordVideoIndex < wordVideos.length - 1) {
      setCurrentWordVideoIndex(currentWordVideoIndex + 1)
    }
  }

  // Get current word video URL from Cloudflare R2
  // Tries multiple folder paths to find the video
  // If video_name is "WAN_ISL_A.mp4", tries:
  //   - First_R2/WAN_ISL_A.mp4
  //   - Second_R2/WAN_ISL_A.mp4
  //   - Third_R2/WAN_ISL_A.mp4
  //   - Fourth_R2/WAN_ISL_A.mp4
  // Returns array of URLs to try in order
  const getWordVideoUrls = () => {
    if (wordVideos.length === 0 || currentWordVideoIndex >= wordVideos.length) {
      console.log('No word videos or invalid index')
      return []
    }
    
    const currentVideo = wordVideos[currentWordVideoIndex]
    console.log('Current video:', currentVideo)
    
    if (!currentVideo || !currentVideo.video_name) {
      console.log('No video_name for current video')
      return []
    }
    
    const videoName = currentVideo.video_name
    
    // If video_name already includes a folder path, use it as-is
    if (videoName.includes('/')) {
      const url = `${CLOUDFLARE_PUBLIC_URL}${videoName}`
      console.log('Using full path URL:', url)
      return [url]
    }
    
    // Otherwise, try all four folders
    const folders = ['First_R2', 'Second_R2', 'Third_R2', 'Fourth_R2']
    const urls = folders.map(folder => `${CLOUDFLARE_PUBLIC_URL}${folder}/${videoName}`)
    console.log('Trying multiple folders:', urls)
    return urls
  }
  
  // Get current video URL (uses first path by default, but video element will try others on error)
  const getCurrentWordVideoUrl = () => {
    const urls = getWordVideoUrls()
    return urls.length > 0 ? urls[0] : null
  }

  // Track failed URLs (video not found in specific folder)
  const [failedVideoUrls, setFailedVideoUrls] = useState(new Set())

  // Handle video loading error from Cloudflare
  const handleVideoError = () => {
    const urls = getWordVideoUrls()
    const currentUrl = urls[0]
    
    // Mark this URL as failed
    setFailedVideoUrls(prev => new Set([...prev, currentUrl]))
    
    // Check if there are more URLs to try for this video
    const failedCount = [...failedVideoUrls, currentUrl].size
    
    if (failedCount >= urls.length) {
      // All folder paths failed for this video, mark the video as failed and move to next
      console.warn(`Video failed to load at index ${currentWordVideoIndex} in all folders`)
      setFailedVideoIndices(prev => new Set([...prev, currentWordVideoIndex]))
      
      // Move to next available video
      if (currentWordVideoIndex < wordVideos.length - 1) {
        setCurrentWordVideoIndex(currentWordVideoIndex + 1)
        setFailedVideoUrls(new Set())
      }
    } else {
      // Try next folder for this video
      const nextUrl = urls[failedCount]
      if (nextUrl) {
        // Reload video with next URL by re-rendering
        setFailedVideoUrls(prev => new Set([...prev, currentUrl]))
      }
    }
  }

  // Get valid video index (skip failed videos)
  const getNextValidVideoIndex = () => {
    for (let i = currentWordVideoIndex + 1; i < wordVideos.length; i++) {
      if (!failedVideoIndices.has(i)) {
        return i
      }
    }
    return -1
  }

  // Get previous valid video index (skip failed videos)
  const getPrevValidVideoIndex = () => {
    for (let i = currentWordVideoIndex - 1; i >= 0; i--) {
      if (!failedVideoIndices.has(i)) {
        return i
      }
    }
    return -1
  }

  // Smart navigate to next with error handling
  const handlePrevWordVideoSmart = () => {
    const prevIndex = getPrevValidVideoIndex()
    if (prevIndex >= 0) {
      setCurrentWordVideoIndex(prevIndex)
    }
  }

  // Smart navigate to next with error handling
  const handleNextWordVideoSmart = () => {
    const nextIndex = getNextValidVideoIndex()
    if (nextIndex >= 0) {
      setCurrentWordVideoIndex(nextIndex)
    }
  }

  if (loading) {
    return (
      <div className="topic-detail-wrapper">
        <Sidebar />
        <div className="topic-detail-container">
          <div className="loading-spinner">Loading topic details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="topic-detail-wrapper">
        <Sidebar />
        <div className="topic-detail-container">
          <div className="error-message">{error}</div>
          <button className="back-btn" onClick={() => navigate(`/module/${moduleId}`)}>
            ← Back to Module
          </button>
        </div>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="topic-detail-wrapper">
        <Sidebar />
        <div className="topic-detail-container">
          <div className="error-message">Topic not found</div>
          <button className="back-btn" onClick={() => navigate(`/module/${moduleId}`)}>
            ← Back to Module
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="topic-detail-wrapper">
      <Sidebar />
      <div className="topic-detail-container">
        <button className="back-btn" onClick={() => navigate(`/module/${moduleId}`)}>
          ← Back to Module
        </button>

        <div className="breadcrumb">
          <span>{module?.module_name} → {topic.topic_name}</span>
        </div>

        <div className="topic-header">
          <h1 className="topic-title">{topic.topic_name}</h1>
          <div className="topic-actions">
            <button 
              className={`complete-btn ${isCompleted ? 'completed' : ''}`}
              onClick={handleMarkComplete}
            >
              {isCompleted ? '✓ Completed' : 'Mark as Complete'}
            </button>
          </div>
        </div>

        <div className="video-container">
          {videoUrl && wordVideos.length > 0 ? (
            // Play topic video first, then word videos
            <VideoSequencePlayer 
              videos={[
                { url: topic.video_name, title: topic.topic_name },
                ...wordVideos.map((video, idx) => ({
                  url: video.video_name,
                  title: video.word_name || `Word Video ${idx + 1}`
                }))
              ]}
              onSequenceComplete={() => {
                console.log('Video sequence complete!')
              }}
            />
          ) : videoUrl ? (
            // Only topic video, no word videos
            <VideoSequencePlayer 
              videos={[
                { url: topic.video_name, title: topic.topic_name }
              ]}
              onSequenceComplete={() => {
                console.log('Topic video complete!')
              }}
            />
          ) : wordVideos.length > 0 ? (
            // Only word videos, no topic video
            <VideoSequencePlayer 
              videos={wordVideos.map((video, idx) => ({
                url: video.video_name,
                title: video.word_name || `Word Video ${idx + 1}`
              }))}
              onSequenceComplete={() => {
                console.log('Word video sequence complete!')
              }}
            />
          ) : playlistLoading ? (
            <div className="video-placeholder">
              <div className="placeholder-content">
                <div className="spinner"></div>
                <p className="placeholder-text">Loading videos...</p>
              </div>
            </div>
          ) : (
            <div className="video-placeholder">
              <div className="placeholder-content">
                <p className="placeholder-text">No videos available for this topic</p>
              </div>
            </div>
          )}
        </div>

        {/* Word Videos Section - Removed: Merged video now plays in placeholder area */}
        {/* Original merged video section has been moved to the main video-placeholder area */}

        <div className="topic-content">
          <div className="content-section">
            <h2 className="section-title">About This Topic</h2>
            <div className="content-text">
              <p>Learn about {topic.topic_name} with video lessons and interactive exercises.</p>
              <p>This topic is part of the <strong>{module?.module_name}</strong> module.</p>
            </div>
          </div>

          <div className="content-section">
            <h2 className="section-title">Learning Objectives</h2>
            <div className="learning-objectives">
              <ul>
                <li>Understand the fundamentals of {topic.topic_name}</li>
                <li>Practice through interactive examples</li>
                <li>Complete the quiz to test your knowledge</li>
                <li>Track your progress and achievements</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h2 className="section-title">Progress</h2>
            <div className="progress-info">
              <div className="progress-indicator">
                <div className={`status-badge ${isCompleted ? 'completed' : 'in-progress'}`}>
                  {isCompleted ? 'Completed' : 'In Progress'}
                </div>
                <p className="progress-text">
                  {isCompleted 
                    ? 'Great job! You have completed this topic.' 
                    : 'You are currently learning this topic.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
