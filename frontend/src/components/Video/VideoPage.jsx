import React, { useState, useRef } from 'react'
import PopupBox from '../Popup/PopupBox'
import { useNavigate } from 'react-router-dom'
import './VideoPage.css'

// Video imports (adjust filenames exactly as in your folder)
import angryMp4 from './Videofiles/I am Angry.mp4'
import classMp4 from './Videofiles/I am sitting in the Class.mp4'
import promiseMp4 from './Videofiles/I Promise.mp4'
import reallySureMp4 from './Videofiles/Really Sure.mp4'
import whatMp4 from './Videofiles/What do you mean.mp4'

const videos = [
  { src: angryMp4, title: 'I am Angry', description: 'I am Angry — description goes here.' },
  { src: classMp4, title: 'I am sitting in the Class', description: 'I am sitting in the Class — description goes here.' },
  { src: promiseMp4, title: 'I Promise', description: 'I Promise — description goes here.' },
  { src: reallySureMp4, title: 'Really Sure', description: 'Really Sure — description goes here.' },
  { src: whatMp4, title: 'What do you mean', description: 'What do you mean — description goes here.' }
]

export default function VideoPage() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState('') // 'left' or 'right' for animation
  const [showPopup, setShowPopup] = useState(false)
  const containerRef = useRef(null)
  const videoRef = useRef(null)

  function goTo(idx) {
    if (idx === current) return
    setDirection(idx > current ? 'right' : 'left')
    // small delay for CSS animation class if needed
    setTimeout(() => setCurrent(idx), 80)
  }

  function handlePrev() {
    if (current > 0) goTo(current - 1)
  }

  function handleNext() {
    if (current === videos.length - 1) {
      setShowPopup(true)
    } else {
      goTo(current + 1)
    }
  }

  // If you want the container to strictly follow the video's native aspect,
  // this sets a CSS variable --aspect that a CSS rule can use.
  function handleLoadedMetadata() {
    const vid = videoRef.current
    const cont = containerRef.current
    if (!vid || !cont) return
    const aspect = (vid.videoWidth && vid.videoHeight) ? (vid.videoWidth / vid.videoHeight) : 1
    cont.style.setProperty('--aspect', aspect)
  }

  return (
    <div className="page-bg">
      <main className="vidcontainer" role="main">
        <section className="video-card">
          <header className="video-header">
            <div className="video-topbar">
              <div className="brand"> Indian Sign Language Academy</div>
              <button className="nav-link-btn" onClick={() => navigate('/login')}>Sign In</button>
            </div>
            <h1 className="title">Learn a New Sign Now!</h1>
          </header>

          <article className="video-player-section">
            <div className="video-slider">
              <button
                className="arrow-btn left-arrow"
                onClick={handlePrev}
                aria-label="Previous video"
                title="Previous"
              >
                ◀
              </button>

              {/* containerRef used to set aspect if needed */}
              <div
                ref={containerRef}
                className={`video-player ${direction ? `fade-${direction}` : ''}`}
              >
                <video
                  ref={videoRef}
                  key={videos[current].src}
                  src={videos[current].src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onLoadedMetadata={handleLoadedMetadata}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>

              <button
                className="arrow-btn right-arrow"
                onClick={handleNext}
                aria-label="Next video"
                title="Next"
              >
                ▶
              </button>
            </div>

            <div className="video-info">
              <h2>{videos[current].title}</h2>
              <p>{videos[current].description}</p>
            </div>

            <div className="slider-controls">
              <div className="progress-dots" role="tablist" aria-label="Video progress">
                {videos.map((_, i) => (
                  <div
                    key={i}
                    role="tab"
                    aria-selected={i === current}
                    tabIndex={0}
                    className={`dot ${i === current ? 'active' : ''}`}
                    onClick={() => goTo(i)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goTo(i) }}
                    aria-label={`Go to video ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </article>
        </section>
      </main>

      {showPopup && <PopupBox onClose={() => setShowPopup(false)} />}
    </div>
  )
}
