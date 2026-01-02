/**
 * Video Merger Utility - Backend Concatenation Approach
 * Videos are concatenated on the backend
 * Frontend receives merged video stream for playback
 */

/**
 * Extract video URLs from fetched video data
 * @param {Array} videoData - Array of video objects from API
 * @returns {Array} - Clean array of video URLs
 */
export const extractVideoUrls = (videoData) => {
  if (!Array.isArray(videoData)) {
    return []
  }

  return videoData
    .filter(v => v && v.url && v.url.trim() !== '')
    .map(v => v.url)
}

/**
 * Send videos to backend for merging/concatenation
 * @param {Array} videoUrls - Array of video URLs to merge
 * @param {string} topicName - Name of the topic
 * @param {string} apiUrl - Backend API URL
 * @returns {Promise<Object>} - Merged video info from backend
 */
export const mergeVideosOnBackend = async (videoUrls, topicName, apiUrl) => {
  try {
    if (!videoUrls || videoUrls.length === 0) {
      throw new Error('No videos to merge')
    }

    console.log(`\n📤 BACKEND VIDEO MERGE`)
    console.log(`═══════════════════════════════════════`)
    console.log(`Topic: ${topicName}`)
    console.log(`Sending ${videoUrls.length} videos to backend...`)

    const response = await fetch(`${apiUrl}/api/topics/merge-videos/${encodeURIComponent(topicName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ videoUrls })
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.ok) {
      throw new Error(data.message || 'Backend merge failed')
    }

    console.log(`✅ Backend merge successful!`)
    console.log(`  Videos prepared: ${data.merged.totalVideos}`)
    console.log(`═══════════════════════════════════════\n`)

    return {
      success: true,
      merged: data.merged,
      videoUrls: data.merged.videoUrls,
      totalVideos: data.merged.totalVideos
    }
  } catch (err) {
    console.error('❌ Backend merge error:', err.message)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * Create a merged video playlist from fetched word videos
 * Only includes videos that have direct URLs provided from API
 * @param {Array} wordVideos - Array of video objects from API with url property
 * @returns {Object} - Object containing available videos and merged playlist info
 */
export const createMergedPlaylist = async (wordVideos) => {
  if (!wordVideos || wordVideos.length === 0) {
    return {
      availableVideos: [],
      totalRequested: 0,
      totalAvailable: 0,
      failedVideos: []
    }
  }
  
  const availableVideos = []
  const failedVideos = []
  
  console.log(`\n📹 MERGING VIDEOS`)
  console.log(`===============================`)
  console.log(`Total videos to merge: ${wordVideos.length}`)
  
  for (let i = 0; i < wordVideos.length; i++) {
    const wordVideo = wordVideos[i]
    
    // Only accept videos that have a URL directly provided
    if (wordVideo.url && wordVideo.url.trim() !== '') {
      const videoInfo = {
        index: i,
        word: wordVideo.word_name || wordVideo.word || `Video ${i + 1}`,
        videoName: wordVideo.video_name || wordVideo.url.split('/').pop(),
        url: wordVideo.url,
        directory: wordVideo.directory || 'unknown'
      }
      availableVideos.push(videoInfo)
      console.log(`✓ [${i + 1}/${wordVideos.length}] ${videoInfo.word} (${videoInfo.directory})`)
    } else {
      failedVideos.push({
        index: i,
        word: wordVideo.word_name || wordVideo.word || `Video ${i + 1}`,
        videoName: wordVideo.video_name || 'unknown',
        reason: 'No URL provided'
      })
      console.log(`✗ [${i + 1}/${wordVideos.length}] ${wordVideo.word_name || wordVideo.word} (no URL)`)
    }
  }
  
  console.log(`\n📊 MERGE SUMMARY`)
  console.log(`Total merged: ${availableVideos.length}/${wordVideos.length}`)
  console.log(`Skipped: ${failedVideos.length}`)
  console.log(`===============================\n`)
  
  return {
    availableVideos,
    failedVideos,
    totalRequested: wordVideos.length,
    totalAvailable: availableVideos.length,
    mergeInfo: {
      skippedCount: failedVideos.length,
      percentageAvailable: wordVideos.length > 0 ? Math.round((availableVideos.length / wordVideos.length) * 100) : 0
    }
  }
}

/**
 * Create HTML5 media source elements for a merged video playlist
 * This creates source elements that will play sequentially
 * @param {Array} availableVideos - Array of available video objects with URLs
 * @returns {Array} - Array of source elements to add to video player
 */
export const createPlaylistSources = (availableVideos) => {
  return availableVideos.map((video, idx) => ({
    src: video.url,
    type: 'video/mp4',
    title: video.word,
    index: idx
  }))
}

/**
 * Create a sequential video player that plays videos one after another
 * @param {HTMLVideoElement} videoElement - The video element to control
 * @param {Array} playlistSources - Array of source objects with src, type, and title
 * @param {Function} onVideoChange - Callback when video changes
 * @returns {Object} - Controller object with playback methods
 */
export const setupSequentialPlayer = (videoElement, playlistSources, onVideoChange = null) => {
  if (!videoElement || !playlistSources || playlistSources.length === 0) {
    console.warn('Invalid video element or playlist sources')
    return null
  }
  
  let currentVideoIndex = 0
  let isPlaying = false
  let totalDuration = 0
  let startTime = 0
  
  // Calculate total duration (we'll update this as videos load)
  const updateTotalDuration = () => {
    totalDuration = 0
    // Add all loaded video durations
    for (let i = 0; i <= currentVideoIndex && i < playlistSources.length; i++) {
      // We'll calculate this as videos load
    }
  }
  
  // Create the ended handler that will be reused
  const handleEnded = () => {
    console.log(`✅ "${playlistSources[currentVideoIndex].title}" finished, auto-loading next...`)
    if (currentVideoIndex < playlistSources.length - 1) {
      // Immediately load and play next video for seamless transition
      loadVideo(currentVideoIndex + 1)
    } else {
      console.log('✅ All videos completed!')
      if (onVideoChange) {
        onVideoChange({
          index: currentVideoIndex,
          title: 'Playlist Complete',
          total: playlistSources.length,
          isComplete: true
        })
      }
    }
  }
  
  // Handle timeupdate to enable seamless looping/continuation
  const handleTimeUpdate = () => {
    // Keep track of current playback
  }
  
  const loadVideo = (index) => {
    if (index < 0 || index >= playlistSources.length) {
      console.log('Playlist ended')
      if (onVideoChange) {
        onVideoChange({
          index: currentVideoIndex,
          title: 'Playlist Complete',
          total: playlistSources.length,
          isComplete: true
        })
      }
      return
    }
    
    currentVideoIndex = index
    const source = playlistSources[index]
    
    console.log(`\n▶️ [${index + 1}/${playlistSources.length}] ${source.title}`)
    
    // Remove old listeners
    videoElement.removeEventListener('ended', handleEnded)
    videoElement.removeEventListener('timeupdate', handleTimeUpdate)
    
    // Clear existing sources
    videoElement.innerHTML = ''
    
    // Add new source
    const sourceElement = document.createElement('source')
    sourceElement.src = source.src
    sourceElement.type = source.type
    
    videoElement.appendChild(sourceElement)
    
    // Add listeners for THIS video
    videoElement.addEventListener('ended', handleEnded, { once: false })
    videoElement.addEventListener('timeupdate', handleTimeUpdate, { once: false })
    
    // Load and play with minimal delay
    videoElement.load()
    
    // Play immediately for seamless transition
    const playPromise = videoElement.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log(`  Playing: ${source.title}`)
          isPlaying = true
        })
        .catch(err => {
          console.warn('⚠️ Play error:', err.message)
          isPlaying = false
        })
    }
    
    if (onVideoChange) {
      onVideoChange({
        index,
        title: source.title,
        total: playlistSources.length,
        isComplete: false,
        progress: `${index + 1}/${playlistSources.length}`
      })
    }
  }
  
  // Start playback
  console.log('\n🎬 MERGED VIDEO PLAYER - SINGLE STREAM MODE')
  console.log(`📋 ${playlistSources.length} videos will play sequentially:`)
  playlistSources.forEach((src, idx) => {
    console.log(`  ${idx + 1}. ${src.title}`)
  })
  console.log('═══════════════════════════════════════════\n')
  
  loadVideo(0)
  
  return {
    loadVideo,
    nextVideo: () => {
      if (currentVideoIndex < playlistSources.length - 1) {
        loadVideo(currentVideoIndex + 1)
      }
    },
    prevVideo: () => {
      if (currentVideoIndex > 0) {
        loadVideo(currentVideoIndex - 1)
      }
    },
    play: () => videoElement.play(),
    pause: () => videoElement.pause(),
    getCurrentIndex: () => currentVideoIndex,
    getCurrentTitle: () => playlistSources[currentVideoIndex]?.title || '',
    getPlaylistSize: () => playlistSources.length
  }
}

/**
 * Generate a summary report of the merged playlist
 * @param {Object} playlistData - Result from createMergedPlaylist
 * @returns {string} - Formatted summary report
 */
export const generatePlaylistSummary = (playlistData) => {
  const { availableVideos, failedVideos, totalRequested, totalAvailable, mergeInfo } = playlistData
  
  let summary = `
📹 MERGED VIDEO PLAYLIST REPORT
================================
Total Videos Requested: ${totalRequested}
Videos Available: ${totalAvailable}
Videos Skipped: ${failedVideos.length}
Availability: ${mergeInfo.percentageAvailable}%

Available Videos (${availableVideos.length}):
${availableVideos.map((v, i) => `  ${i + 1}. ${v.word} (${v.videoName})`).join('\n')}
${failedVideos.length > 0 ? `
Skipped Videos (${failedVideos.length}):
${failedVideos.map((v, i) => `  ${i + 1}. ${v.word} (${v.videoName})`).join('\n')}
` : ''}
================================
  `
  
  return summary.trim()
}

export default {
  createMergedPlaylist,
  createPlaylistSources,
  setupSequentialPlayer,
  generatePlaylistSummary
}
