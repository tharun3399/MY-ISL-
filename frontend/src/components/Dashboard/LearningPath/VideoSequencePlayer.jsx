import React, { useState, useRef, useEffect } from 'react'
import './VideoSequencePlayer.css'

const CLOUDFLARE_PUBLIC_URL = 'https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/'
const VIDEO_FOLDER = 'Animated' // Only search in Animated folder
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Generate video URL - use backend proxy to bypass CORS
const generateVideoUrls = (videoUrl) => {
  // Extract filename from URL
  let filename = videoUrl
  
  if (videoUrl.includes('/')) {
    const parts = videoUrl.split('/')
    filename = parts[parts.length - 1] // Get last part after last /
  }
  
  // Use backend proxy endpoint for video
  const proxyUrl = `${API_BASE_URL}/api/video/${filename}`
  console.log(`Generated proxy URL: ${proxyUrl}`)
  return [proxyUrl]
}

export default function VideoSequencePlayer({ videos = [], onSequenceComplete = () => {} }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayText, setOverlayText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
  const [preloadProgress, setPreloadProgress] = useState(0) // Track preload progress
  const videoRef = useRef(null)
  const urlsToTryRef = useRef([])
  const preloadRefsRef = useRef({}) // Store all preload video elements
  const allVideoUrlsRef = useRef({}) // Store all successfully loaded video URLs

  const currentVideo = videos[currentIndex]
  const isLastVideo = currentIndex === videos.length - 1

  // Preload ALL videos at the start
  useEffect(() => {
    if (videos.length === 0) return
    
    console.log(`\n🎬 PRELOADING ALL ${videos.length} VIDEOS...`)
    
    // Show overlay for first video
    if (videos.length > 0) {
      const firstVideo = videos[0]
      setOverlayText(firstVideo.title || 'Video 1')
      setShowOverlay(true)
      console.log(`📺 Showing overlay for first video: ${firstVideo.title}`)
      
      // Hide overlay after animation (3 seconds)
      const overlayTimeout = setTimeout(() => {
        setShowOverlay(false)
      }, 3000)
      
      return () => clearTimeout(overlayTimeout)
    }
  }, [videos.length])
    
  useEffect(() => {
    if (videos.length === 0) return
    
    console.log(`\n🎬 PRELOADING ALL ${videos.length} VIDEOS...`)
    
    const preloadAllVideos = async () => {
      let loaded = 0
      
      // Create preload elements for all videos in parallel
      const preloadPromises = videos.map((video, idx) => {
        return new Promise((resolve) => {
          const videoEl = document.createElement('video')
          videoEl.style.display = 'none'
          videoEl.crossOrigin = 'anonymous'
          document.body.appendChild(videoEl)
          preloadRefsRef.current[idx] = videoEl
          
          const videoUrl = generateVideoUrls(video.url)[0]
          console.log(`⏳ [Video ${idx + 1}/${videos.length}] Preloading: ${videoUrl}`)
          
          videoEl.src = videoUrl
          
          const onSuccess = () => {
            console.log(`✅ [Video ${idx + 1}/${videos.length}] Preloaded: ${video.title}`)
            allVideoUrlsRef.current[idx] = videoUrl
            loaded++
            setPreloadProgress(Math.round((loaded / videos.length) * 100))
            videoEl.removeEventListener('canplay', onSuccess)
            videoEl.removeEventListener('error', onError)
            resolve()
          }
          
          const onError = () => {
            console.error(`❌ [Video ${idx + 1}/${videos.length}] Preload failed: ${video.title}`)
            videoEl.removeEventListener('canplay', onSuccess)
            videoEl.removeEventListener('error', onError)
            resolve() // Still resolve so we don't block
          }
          
          videoEl.addEventListener('canplay', onSuccess, { once: true })
          videoEl.addEventListener('error', onError, { once: true })
        })
      })
      
      await Promise.all(preloadPromises)
      console.log(`\n✨ ALL ${videos.length} VIDEOS PRELOADED! Ready to play.`)
      setPreloadProgress(100)
      setIsLoading(false)
    }
    
    preloadAllVideos()
  }, [videos])

  // Handle video end - show overlay and move to next video
  const handleVideoEnd = () => {
    console.log(`Video ${currentIndex + 1} ended. Is last video: ${isLastVideo}`)
    if (isLastVideo) {
      // Sequence complete
      console.log('✅ All videos played! Sequence complete.')
      onSequenceComplete()
    } else {
      // Show overlay between videos (only if more than one video)
      if (videos.length > 1) {
        const nextVideoTitle = videos[currentIndex + 1]
        setOverlayText(nextVideoTitle.title || `Video ${currentIndex + 2}`)
        setShowOverlay(true)
        console.log(`Showing overlay for next video: ${nextVideoTitle.title}`)

        // Auto-advance after animation completes (3 seconds)
        setTimeout(() => {
          console.log(`Moving to video ${currentIndex + 2}...`)
          setShowOverlay(false)
          setCurrentIndex(prev => prev + 1)
          setCurrentUrlIndex(0)
        }, 3000)
      } else {
        // Single video, just mark complete
        onSequenceComplete()
      }
    }
  }

  // Handle video can play
  const handleCanPlay = () => {
    console.log('▶️ Video ready to play:', videoRef.current?.querySelector('source')?.src)
    setIsLoading(false)
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log('Autoplay prevented or error:', err))
    }
  }

  // Handle loading state
  const handleLoadStart = () => {
    setIsLoading(true)
  }

  // Handle error
  const handleError = (e) => {
    console.error('❌ Video error event fired:', videoRef.current?.querySelector('source')?.src)
    if (!isLastVideo) {
      setCurrentIndex(prev => Math.min(prev + 1, videos.length - 1))
    } else {
      setIsLoading(false)
    }
  }

  // Load video with the preloaded URL
  const loadVideoWithUrl = (urlToLoad) => {
    if (!videoRef.current) {
      console.warn('Video ref not available')
      return
    }
    
    console.log(`🎬 Loading video URL: ${urlToLoad}`)
    
    // Clear any existing sources
    while (videoRef.current.firstChild) {
      videoRef.current.removeChild(videoRef.current.firstChild)
    }
    
    // Create and add source element
    const sourceEl = document.createElement('source')
    sourceEl.src = urlToLoad
    sourceEl.type = 'video/mp4'
    videoRef.current.appendChild(sourceEl)
    
    // Reset and load video
    videoRef.current.currentTime = 0
    videoRef.current.load()
    console.log(`📡 load() called for: ${urlToLoad}`)
  }

  // When index changes, load the preloaded video
  useEffect(() => {
    if (!currentVideo?.url) {
      console.log('No current video or URL')
      return
    }
    
    console.log(`\n▶️ [VIDEO ${currentIndex + 1}/${videos.length}] Playing: ${currentVideo.url} (${currentVideo.title})`)
    
    // Use the preloaded URL for this video
    if (allVideoUrlsRef.current[currentIndex]) {
      const videoUrl = allVideoUrlsRef.current[currentIndex]
      console.log(`✅ Using preloaded video URL: ${videoUrl}`)
      loadVideoWithUrl(videoUrl)
      setIsLoading(false)
    } else {
      console.warn(`⚠️ Video ${currentIndex + 1} not preloaded yet, using fallback...`)
      const videoUrl = generateVideoUrls(currentVideo.url)[0]
      loadVideoWithUrl(videoUrl)
    }
  }, [currentIndex])

  if (!videos || videos.length === 0) {
    return <div className="no-videos-message">No videos available</div>
  }

  return (
    <>
      <div className="video-sequence-player">
        {showOverlay && <VideoOverlay text={overlayText} />}

        {isLoading && (
          <div className="video-loading-indicator">
            <div className="spinner-small"></div>
            <p>Loading video...</p>
          </div>
        )}

        <video
          key={currentIndex}
          ref={videoRef}
          className="sequence-video"
          controls
          onEnded={handleVideoEnd}
          onCanPlay={handleCanPlay}
          onLoadStart={handleLoadStart}
          onError={handleError}
          onLoadedMetadata={() => console.log('✅ Video metadata loaded, ready to play')}
          crossOrigin="anonymous"
        >
          Your browser does not support the video tag.
        </video>

        {/* Video Counter */}
        <div className="video-counter">
          Video {currentIndex + 1} of {videos.length}
        </div>
      </div>

      {/* Navigation Buttons - Outside video player */}
      <div className="video-navigation">
        <button
          className="nav-btn prev-btn"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>
        <button
          className="nav-btn next-btn"
          onClick={() => setCurrentIndex(Math.min(videos.length - 1, currentIndex + 1))}
          disabled={currentIndex === videos.length - 1}
        >
          Next →
        </button>
      </div>
    </>
  )
}

function VideoOverlay({ text = 'Next Video' }) {
  return (
    <div className="video-overlay">
      <div className="overlay-content">
        <h2 className="overlay-text">{text}</h2>
      </div>
    </div>
  )
}
