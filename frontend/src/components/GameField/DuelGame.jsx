import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { SidebarContext } from '../../context/SidebarContext'
import Sidebar from '../Dashboard/Sidebar/Sidebar'
import { io } from 'socket.io-client'
import './GamePlayArea.css'

export default function DuelGame() {
  const { user } = useContext(AuthContext)
  const { sidebarOpen, screenSize } = useContext(SidebarContext)
  const navigate = useNavigate()
  const [socket, setSocket] = useState(null)
  const [gameState, setGameState] = useState('lobby') // lobby, queue, playing, results
  const [matchId, setMatchId] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [scores, setScores] = useState({})
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [winner, setWinner] = useState(null)
  const [timeLeft, setTimeLeft] = useState(10)

  // Initialize socket
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
      console.log('Connected to game server')
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    // Listen for matched event from matchmaker (REST-based)
    newSocket.on('matched', (payload) => {
      console.log('[DuelGame] matched event received', payload)
      if (payload && payload.matchId) {
        setMatchId(payload.matchId)
        const otherPlayer = payload.players.find(p => p.userId !== user?.id)
        console.log('[DuelGame] other player:', otherPlayer)
        setOpponent(otherPlayer)
        // Join the match room
        console.log('[DuelGame] emitting duel:join-room with:', { matchId: payload.matchId, userId: user?.id })
        newSocket.emit('duel:join-room', {
          matchId: payload.matchId,
          user: { id: user?.id, name: user?.name }
        }, (ack) => {
          console.log('[DuelGame] duel:join-room ack received:', ack)
        })
      }
    })

    // Listen for duel:opponent (socket-based, used by duel.js)
    newSocket.on('duel:opponent', (data) => {
      console.log('[DuelGame] duel:opponent event received', data)
      setOpponent(data.opponent)
    })

    // Listen for duel:match-starting to know match has started
    newSocket.on('duel:match-starting', (data) => {
      console.log('[DuelGame] duel:match-starting event received', data)
      if (data && data.matchId) {
        setMatchId(data.matchId)
        setGameState('playing')
      }
    })

    newSocket.on('duel:question', (data) => {
      console.log('[DuelGame] duel:question event received', data)
      setCurrentQuestion(data)
      setQuestionIndex(data.idx)
      setTimeLeft(10)
      setSelectedAnswer(null)
    })

    newSocket.on('duel:reveal', (data) => {
      console.log('[DuelGame] duel:reveal event received', data)
      setScores(data.scores)
    })

    newSocket.on('duel:match-end', (data) => {
      console.log('[DuelGame] duel:match-end event received', data)
      setWinner(data.result.winner)
      setGameState('results')
    })

    setSocket(newSocket)
    return () => newSocket.close()
  }, [user])

  // Timer for questions
  useEffect(() => {
    if (gameState !== 'playing' || !currentQuestion) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, currentQuestion])

  const handleFindMatch = () => {
    if (!socket) {
      console.error('[DuelGame] Socket not initialized')
      return
    }
    if (!user?.id) {
      console.error('[DuelGame] User ID not available')
      return
    }
    
    setGameState('queue')
    const queueId = `queue-${Date.now()}`
    console.log('[DuelGame] Subscribing to queue:', { queueId, userId: user?.id, username: user?.name })
    
    socket.emit('queue:subscribe', {
      queueId,
      userId: user?.id,
      username: user?.name,
      settings: { mode: 'competitive', duration: 1 }
    })
  }

  const handleAnswer = (index) => {
    if (selectedAnswer !== null || !socket || !matchId) return
    setSelectedAnswer(index)
    socket.emit('duel:answer', {
      matchId,
      userId: user?.id,
      selectedIndex: index
    })
  }

  const handleBackToLobby = () => {
    navigate('/practice-mode')
  }

  if (gameState === 'lobby') {
    return (
      <div className={`gameplay-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar />
        <div className="gameplay-container">
          <div className="game-lobby">
            <div className="lobby-card">
              <h1 className="lobby-title">⚔️ Duel</h1>
              <p className="lobby-subtitle">Challenge a random player in a 1v1 quiz battle</p>
              
              <div className="game-info">
                <div className="info-item">
                  <span className="info-icon">❓</span>
                  <div>
                    <div className="info-label">Questions</div>
                    <div className="info-value">5</div>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">⏱️</span>
                  <div>
                    <div className="info-label">Time per Question</div>
                    <div className="info-value">10s</div>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">🏆</span>
                  <div>
                    <div className="info-label">Prize</div>
                    <div className="info-value">XP Rewards</div>
                  </div>
                </div>
              </div>

              <button className="primary-btn" onClick={handleFindMatch}>
                Find Opponent
              </button>

              <button className="secondary-btn" onClick={handleBackToLobby}>
                Back to GameField
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'queue') {
    return (
      <div className={`gameplay-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar />
        <div className="gameplay-container">
          <div className="game-queue">
            <div className="queue-card">
              <div className="spinner"></div>
              <h2>Finding Opponent...</h2>
              <p>Please wait while we find a worthy opponent for you</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'playing' && currentQuestion) {
    const isTimeUp = timeLeft === 0
    const timerColor = timeLeft <= 3 ? '#ef4444' : timeLeft <= 5 ? '#f59e0b' : '#10b981'

    return (
      <div className={`gameplay-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar />
        <div className="gameplay-container">
          <div className="game-playing">
            {/* Header with scores */}
            <div className="game-header">
              <div className="player-info">
                <div className="player">
                  <span className="player-name">{user?.name || 'You'}</span>
                  <span className="player-score">{scores[user?.id] || 0} pts</span>
                </div>
                <div className="vs">VS</div>
                <div className="player">
                  <span className="player-name">{opponent?.username || opponent?.name || 'Opponent'}</span>
                  <span className="player-score">{scores[opponent?.userId] || 0} pts</span>
                </div>
              </div>
              <div className="timer-container">
                <div className="timer" style={{ color: timerColor }}>
                  {timeLeft}s
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="question-area">
              <div className="question-number">Question {questionIndex + 1} of 5</div>
              <h2 className="question-statement">{currentQuestion.statement}</h2>

              {/* Answers */}
              <div className="answers-grid">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`answer-btn ${selectedAnswer === index ? 'selected' : ''} ${isTimeUp ? 'disabled' : ''}`}
                    onClick={() => handleAnswer(index)}
                    disabled={isTimeUp || selectedAnswer !== null}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>

              {selectedAnswer !== null && (
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

  // Fallback for playing state while waiting for first question
  if (gameState === 'playing' && !currentQuestion) {
    return (
      <div className={`gameplay-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar />
        <div className="gameplay-container">
          <div className="game-queue">
            <div className="queue-card">
              <div className="spinner"></div>
              <h2>Match Starting...</h2>
              <p>Opponent: {opponent?.username || opponent?.name || 'Finding...'}</p>
              <p>Get ready for your first question!</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'results') {
    const userScore = scores[user?.id] || 0
    const opponentScore = scores[opponent?.userId] || 0
    const isWin = winner === user?.id
    const isTie = winner === 'tie'

    return (
      <div className={`gameplay-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar />
        <div className="gameplay-container">
          <div className="game-results">
            <div className="results-card">
              <div className={`result-badge ${isWin ? 'win' : isTie ? 'tie' : 'loss'}`}>
                {isWin ? '🎉 Victory!' : isTie ? '🤝 Tie!' : '😌 Good Try!'}
              </div>

              <div className="final-scores">
                <div className={`score-box ${isWin ? 'winner' : ''}`}>
                  <div className="score-player">{user?.name || 'You'}</div>
                  <div className="score-value">{userScore}</div>
                </div>
                <div className="score-vs">VS</div>
                <div className={`score-box ${winner === opponent?.userId ? 'winner' : ''}`}>
                  <div className="score-player">{opponent?.username || 'Opponent'}</div>
                  <div className="score-value">{opponentScore}</div>
                </div>
              </div>

              <div className="reward-info">
                <div className="reward">
                  <span className="reward-icon">⭐</span>
                  <div>
                    <div className="reward-label">XP Earned</div>
                    <div className="reward-value">{isWin ? '+100 XP' : '+50 XP'}</div>
                  </div>
                </div>
              </div>

              <button className="primary-btn" onClick={handleFindMatch}>
                Play Again
              </button>
              <button className="secondary-btn" onClick={handleBackToLobby}>
                Back to GameField
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
