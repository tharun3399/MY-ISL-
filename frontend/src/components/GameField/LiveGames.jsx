import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { SidebarContext } from '../../context/SidebarContext'
import Sidebar from '../Dashboard/Sidebar/Sidebar'
import { io } from 'socket.io-client'
import './GamePlayArea.css'

export default function LiveGames() {
  const { user } = useContext(AuthContext)
  const { sidebarOpen, screenSize } = useContext(SidebarContext)
  const navigate = useNavigate()
  const [socket, setSocket] = useState(null)
  const [gameState, setGameState] = useState('lobby') // lobby, joining, playing, results
  const [gameKey, setGameKey] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [playerScore, setPlayerScore] = useState(0)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      navigate('/login')
      return
    }

    const token = localStorage.getItem('token')
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
      auth: {
        token: token || ''
      }
    })

    newSocket.on('connect', () => {
      console.log('Connected to live games server')
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    newSocket.on('games:joined', (data) => {
      console.log('Joined game:', data)
    })

    newSocket.on('games:started', (data) => {
      setGameState('playing')
    })

    newSocket.on('games:question', (data) => {
      setCurrentQuestion(data)
      setSelectedAnswer(null)
      setAnswered(false)
    })

    newSocket.on('games:answer-received', (data) => {
      setAnswered(true)
    })

    newSocket.on('games:leaderboard', (data) => {
      setLeaderboard(data.leaderboard)
    })

    newSocket.on('games:finished', (data) => {
      setGameState('results')
    })

    setSocket(newSocket)
    return () => newSocket.close()
  }, [])

  const handleJoinGame = () => {
    if (!socket || !user) return
    const key = `game-${Date.now()}`
    setGameKey(key)
    socket.emit('games:join', {
      gameKey: key,
      user: { id: user.id, name: user.name }
    })
    setGameState('joining')
  }

  const handleStartGame = () => {
    if (!socket || !gameKey) return
    socket.emit('games:start', { gameKey })
  }

  const handleAnswerQuestion = (index) => {
    if (!socket || !gameKey || answered) return
    socket.emit('games:answer', {
      gameKey,
      user: { id: user.id, name: user.name },
      questionIdx: currentQuestion.idx,
      selectedIndex: index
    })
  }

  if (gameState === 'lobby') {
    return (
      <div className={`gameplay-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar />
        <div className="gameplay-container">
          <div className="game-lobby">
            <div className="lobby-card">
              <h1 className="lobby-title">🏆 Live Games</h1>
              <p className="lobby-subtitle">Join a live group quiz and compete with others. Speed matters!</p>
              
              <div className="game-info">
                <div className="info-item">
                  <span className="info-icon">👥</span>
                  <div>
                    <div className="info-label">Players</div>
                    <div className="info-value">Multiple</div>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">⚡</span>
                  <div>
                    <div className="info-label">Scoring</div>
                    <div className="info-value">Speed Bonus</div>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">🏅</span>
                  <div>
                    <div className="info-label">Top 3</div>
                    <div className="info-value">Get XP</div>
                  </div>
                </div>
              </div>

              <button className="primary-btn" onClick={handleJoinGame}>
                Join Live Game
              </button>

              <button className="secondary-btn" onClick={() => navigate('/practice-mode')}>
                Back to GameField
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'joining') {
    return (
      <div className={`gameplay-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar />
        <div className="gameplay-container">
          <div className="game-queue">
            <div className="queue-card">
              <div className="spinner"></div>
              <h2>Waiting for Game to Start...</h2>
              <p>Waiting for admin to start the live game</p>
              <button className="secondary-btn" onClick={() => setGameState('lobby')}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'playing' && currentQuestion) {
    return (
      <div className={`gameplay-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar />
        <div className="gameplay-container">
          <div className="game-playing">
            {/* Leaderboard */}
            <div className="leaderboard-mini">
              <h3>Live Leaderboard</h3>
              {leaderboard.slice(0, 5).map((player, index) => (
                <div key={index} className="leaderboard-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="score">{player.score} pts</span>
                </div>
              ))}
            </div>

            {/* Question */}
            <div className="question-area">
              <div className="question-number">Question {currentQuestion.idx + 1}</div>
              <h2 className="question-statement">{currentQuestion.statement}</h2>

              <div className="answers-grid">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`answer-btn ${selectedAnswer === index ? 'selected' : ''} ${answered ? 'disabled' : ''}`}
                    onClick={() => handleAnswerQuestion(index)}
                    disabled={answered}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>

              {answered && (
                <div className="answer-submitted">
                  ✓ Answer submitted
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'results') {
    const yourRank = leaderboard.findIndex(p => p.userId === user?.id) + 1 || '-'
    const yourScore = leaderboard.find(p => p.userId === user?.id)?.score || 0

    return (
      <div className={`gameplay-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar />
        <div className="gameplay-container">
          <div className="game-results">
            <div className="results-card">
              <h1 className="lobby-title">Game Finished!</h1>

              <div className="final-scores">
                <div className="score-box">
                  <div className="score-player">Your Rank</div>
                  <div className="score-value">{yourRank}</div>
                </div>
                <div className="score-box">
                  <div className="score-player">Your Score</div>
                  <div className="score-value">{yourScore}</div>
                </div>
              </div>

              <div className="reward-info">
                <div className="reward">
                  <span className="reward-icon">⭐</span>
                  <div>
                    <div className="reward-label">XP Earned</div>
                    <div className="reward-value">
                      {yourRank === 1 ? '+100 XP' : yourRank === 2 ? '+60 XP' : yourRank === 3 ? '+30 XP' : '+10 XP'}
                    </div>
                  </div>
                </div>
              </div>

              <h3>Final Leaderboard</h3>
              <div className="final-leaderboard">
                {leaderboard.map((player, index) => (
                  <div key={index} className={`leaderboard-row ${index < 3 ? 'top' : ''}`}>
                    <span className="rank">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                    <span className="player-name">Player {player.userId}</span>
                    <span className="final-score">{player.score} pts</span>
                  </div>
                ))}
              </div>

              <button className="primary-btn" onClick={() => {
                setGameState('lobby')
                setGameKey(null)
              }}>
                Play Again
              </button>
              <button className="secondary-btn" onClick={() => navigate('/practice-mode')}>
                Back to GameField
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
