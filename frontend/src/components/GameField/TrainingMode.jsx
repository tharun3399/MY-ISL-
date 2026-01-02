import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import './GameField.css'
import './GamePlayArea.css'

const TrainingMode = () => {
  const navigate = useNavigate()
  const { authState } = useContext(AuthContext)
  const user = authState?.user
  
  const [gameState, setGameState] = useState('lobby') // lobby, playing, results
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [totalQuestions] = useState(10)
  const [difficulty, setDifficulty] = useState('intermediate') // beginner, intermediate, advanced
  const [results, setResults] = useState(null)
  const [xpEarned, setXpEarned] = useState(0)

  // Sample questions - in production, fetch from API based on difficulty
  const questionPool = {
    beginner: [
      { id: 1, text: 'How do you sign "hello" in ISL?', options: ['Wave hand', 'Point to ears', 'Touch forehead'], correct: 0 },
      { id: 2, text: 'Which hand position is for "yes"?', options: ['Open palm', 'Fist', 'Pointed fingers'], correct: 0 },
      { id: 3, text: 'What does nodding mean in ISL?', options: ['No', 'Yes', 'Maybe'], correct: 1 },
      { id: 4, text: 'How to express "I" in ISL?', options: ['Point up', 'Point to yourself', 'Shake hands'], correct: 1 },
      { id: 5, text: 'Sign for "thank you"?', options: ['Hand to mouth', 'Clapping', 'Waving'], correct: 0 },
      { id: 6, text: 'What about "goodbye"?', options: ['Waving', 'Nodding', 'Pointing'], correct: 0 },
      { id: 7, text: 'How to show "happy"?', options: ['Smile and nod', 'Frown', 'Close eyes'], correct: 0 },
      { id: 8, text: 'Sign for "water"?', options: ['W-hand shape', 'C-hand shape', 'O-hand shape'], correct: 1 },
      { id: 9, text: 'Express "hungry"?', options: ['Tap stomach', 'Point to mouth', 'Rub belly'], correct: 2 },
      { id: 10, text: 'Sign for "friend"?', options: ['Link fingers', 'Wave hands', 'Cross arms'], correct: 0 }
    ],
    intermediate: [
      { id: 1, text: 'What is the correct hand shape for the letter M?', options: ['Three fingers down', 'Four fingers down', 'Two fingers down'], correct: 1 },
      { id: 2, text: 'How do you express feelings in ISL?', options: ['Facial expressions', 'Hand movements only', 'Voice'], correct: 0 },
      { id: 3, text: 'What does body position indicate?', options: ['Subject/object', 'Time', 'Tense'], correct: 0 },
      { id: 4, text: 'How to express past tense?', options: ['Move hands backward', 'Move hands forward', 'Tap twice'], correct: 0 },
      { id: 5, text: 'What is classifier in ISL?', options: ['Hand shape showing object', 'Number sign', 'Time sign'], correct: 0 },
      { id: 6, text: 'How to sign "tall person"?', options: ['High hand position', 'Tall stance', 'Large gestures'], correct: 0 },
      { id: 7, text: 'What does eye gaze indicate?', options: ['Direction/reference', 'Emotion', 'Agreement'], correct: 0 },
      { id: 8, text: 'How to express "very" in ISL?', options: ['Repeat sign larger', 'Repeat sign faster', 'Add facial expression'], correct: 2 },
      { id: 9, text: 'What is the sign for "beautiful"?', options: ['Trace face outline', 'Touch heart', 'Raise arms'], correct: 0 },
      { id: 10, text: 'How do negations work in ISL?', options: ['Shake head while signing', 'Sign "not"', 'Use different hand'], correct: 0 }
    ],
    advanced: [
      { id: 1, text: 'Explain the use of spatial mapping in ISL?', options: ['Locating entities in space', 'Creating sentences', 'Expressing emotions'], correct: 0 },
      { id: 2, text: 'What are constructed action scenes?', options: ['Role-shifting', 'Mime', 'Acting'], correct: 0 },
      { id: 3, text: 'How does ISL express causation?', options: ['Spatial relationships', 'Modifiers', 'Directional verbs'], correct: 0 },
      { id: 4, text: 'What is the purpose of role shift?', options: ['Represent different perspectives', 'Add humor', 'Fill silence'], correct: 0 },
      { id: 5, text: 'Explain temporal aspect in ISL?', options: ['When event happened', 'Duration of action', 'Frequency'], correct: 1 },
      { id: 6, text: 'How do directional verbs work?', options: ['Move in space showing relationship', 'Change speed', 'Repeat pattern'], correct: 0 },
      { id: 7, text: 'What is a non-manual marker?', options: ['Facial expression/body movement', 'Hand sign', 'Location'], correct: 0 },
      { id: 8, text: 'How to express plurality in ISL?', options: ['Repeat sign with arc motion', 'Use plural sign', 'Point multiple times'], correct: 0 },
      { id: 9, text: 'Explain topicalization in ISL?', options: ['Establish topic first, comment later', 'Topic at end', 'No topic marker'], correct: 0 },
      { id: 10, text: 'What does agreement morphology show?', options: ['Subject-verb agreement', 'Tense', 'Aspect'], correct: 0 }
    ]
  }

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
  }, [user, navigate])

  useEffect(() => {
    if (gameState === 'playing' && currentQuestion) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp()
            return 15
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameState, currentQuestion])

  const startGame = () => {
    setGameState('playing')
    loadQuestion(0)
  }

  const loadQuestion = (index) => {
    if (index < totalQuestions) {
      const questions = questionPool[difficulty]
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
      setCurrentQuestion(randomQuestion)
      setQuestionIndex(index)
      setTimeLeft(15)
      setSelectedAnswer(null)
      setAnswered(false)
    } else {
      endGame()
    }
  }

  const handleAnswer = (optionIndex) => {
    setSelectedAnswer(optionIndex)
    setAnswered(true)

    if (optionIndex === currentQuestion.correct) {
      const points = Math.max(0, timeLeft * 10)
      setScore(prev => prev + points)
      setXpEarned(prev => prev + Math.ceil(points / 5))
    }

    setTimeout(() => {
      loadQuestion(questionIndex + 1)
    }, 1500)
  }

  const handleTimeUp = () => {
    setSelectedAnswer(null)
    setAnswered(true)
    setTimeout(() => {
      loadQuestion(questionIndex + 1)
    }, 1500)
  }

  const endGame = () => {
    setGameState('results')
    setResults({
      totalQuestions,
      correctAnswers: Math.round(score / 1000),
      score,
      accuracy: Math.round((Math.round(score / 1000) / totalQuestions) * 100),
      difficulty,
      xpEarned
    })
  }

  const handleBackToHub = () => {
    navigate('/practice-mode')
  }

  const getTimeColor = () => {
    if (timeLeft > 10) return '#10b981'
    if (timeLeft > 5) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <h1>📚 Training Mode</h1>
        <button className="back-btn" onClick={handleBackToHub}>
          ← Back to Hub
        </button>
      </div>

      {/* Lobby State - Difficulty Selection */}
      {gameState === 'lobby' && (
        <div className="lobby-screen">
          <div className="lobby-content">
            <div className="game-icon">📚</div>
            <h2>ISL Training Mode</h2>
            <p>Practice and improve your ISL skills at your own pace</p>
            
            <div className="difficulty-selector">
              <h3>Select Difficulty Level</h3>
              <div className="difficulty-grid">
                {['beginner', 'intermediate', 'advanced'].map(level => (
                  <button
                    key={level}
                    className={`difficulty-btn ${difficulty === level ? 'active' : ''}`}
                    onClick={() => setDifficulty(level)}
                  >
                    <span className="difficulty-icon">
                      {level === 'beginner' && '🌱'}
                      {level === 'intermediate' && '🌿'}
                      {level === 'advanced' && '🏆'}
                    </span>
                    <span className="difficulty-name">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="game-info-grid">
              <div className="info-card">
                <span className="info-label">Questions</span>
                <span className="info-value">10</span>
              </div>
              <div className="info-card">
                <span className="info-label">Time per Q</span>
                <span className="info-value">15 sec</span>
              </div>
              <div className="info-card">
                <span className="info-label">Scoring</span>
                <span className="info-value">Time-based</span>
              </div>
              <div className="info-card">
                <span className="info-label">Mode</span>
                <span className="info-value">Solo Practice</span>
              </div>
            </div>

            <button className="play-btn" onClick={startGame}>
              Start Training
            </button>
          </div>
        </div>
      )}

      {/* Playing State */}
      {gameState === 'playing' && currentQuestion && (
        <div className="game-screen">
          <div className="game-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(questionIndex / totalQuestions) * 100}%` }}
              ></div>
            </div>
            <span className="progress-text">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
          </div>

          <div className="game-content">
            <div className="score-display">Score: {Math.round(score)} XP: {xpEarned}</div>
            
            <div className="timer" style={{ color: getTimeColor() }}>
              ⏱️ {timeLeft}s
            </div>

            <h2 className="question">{currentQuestion.text}</h2>

            <div className="options-grid">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  className={`option-btn ${
                    selectedAnswer === idx ? 
                      (answered ? (idx === currentQuestion.correct ? 'correct' : 'incorrect') : 'selected') 
                      : ''
                  }`}
                  onClick={() => !answered && handleAnswer(idx)}
                  disabled={answered}
                >
                  <span className="option-letter">{String.fromCharCode(65 + idx)}.</span>
                  <span className="option-text">{option}</span>
                  {answered && idx === currentQuestion.correct && <span className="check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results State */}
      {gameState === 'results' && results && (
        <div className="results-screen">
          <div className="results-content">
            <h2>📊 Training Complete!</h2>
            
            <div className="results-cards">
              <div className="result-card">
                <span className="result-label">Score</span>
                <span className="result-value">{results.score}</span>
              </div>
              <div className="result-card">
                <span className="result-label">Accuracy</span>
                <span className="result-value">{results.accuracy}%</span>
              </div>
              <div className="result-card">
                <span className="result-label">Correct</span>
                <span className="result-value">{results.correctAnswers}/{results.totalQuestions}</span>
              </div>
              <div className="result-card">
                <span className="result-label">XP Earned</span>
                <span className="result-value xp">+{results.xpEarned}</span>
              </div>
            </div>

            <div className="performance-message">
              {results.accuracy >= 80 && <p>🌟 Excellent performance! You're mastering ISL!</p>}
              {results.accuracy >= 60 && results.accuracy < 80 && <p>⭐ Great job! Keep practicing to improve!</p>}
              {results.accuracy >= 40 && results.accuracy < 60 && <p>👍 Good effort! Review the basics and try again.</p>}
              {results.accuracy < 40 && <p>💪 Keep learning! Practice makes perfect!</p>}
            </div>

            <div className="action-buttons">
              <button className="play-again-btn" onClick={() => {
                setGameState('lobby')
                setScore(0)
                setXpEarned(0)
                setResults(null)
              }}>
                Train Again
              </button>
              <button className="back-to-hub-btn" onClick={handleBackToHub}>
                Back to Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrainingMode
