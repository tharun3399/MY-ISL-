// frontend/src/components/Dashboard/LearningPath/Quiz/Quiz.jsx
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './Quiz.css'

export default function Quiz({ topicId, onComplete, onSkip }) {
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Load quiz questions
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true)
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quiz/generate/${topicId}?count=10`,
          { withCredentials: true }
        )

        if (response.data.ok) {
          setQuestions(response.data.questions)
          setSelectedAnswers(new Array(response.data.questions.length).fill(null))
        }
      } catch (err) {
        console.error('Error loading quiz:', err)
        setError('Failed to load quiz questions')
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [topicId])

  const handleAnswerSelect = (optionIndex) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = optionIndex
    setSelectedAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (selectedAnswers.some(ans => ans === null)) {
      setError('Please answer all questions before submitting')
      return
    }

    try {
      setSubmitting(true)
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quiz/submit`,
        {
          topicId,
          answers: selectedAnswers
        },
        { withCredentials: true }
      )

      if (response.data.ok) {
        setResult(response.data)
        if (response.data.passed) {
          // Quiz passed, auto-complete after 2 seconds
          setTimeout(() => {
            onComplete(response.data)
          }, 2000)
        }
      }
    } catch (err) {
      console.error('Error submitting quiz:', err)
      setError('Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="quiz-loading">Loading quiz...</div>
  }

  if (result) {
    // Show results
    return (
      <div className="quiz-container quiz-results">
        <div className="quiz-result-card">
          <div className={`quiz-result-icon ${result.passed ? 'pass' : 'fail'}`}>
            {result.passed ? '✓' : '✗'}
          </div>
          <div className="quiz-result-score">
            {result.score}%
          </div>
          <div className="quiz-result-message">
            {result.passed ? 'Quiz Passed!' : 'Quiz Failed'}
          </div>
          <div className="quiz-result-details">
            <p>You got {result.correctCount} out of {result.totalCount} questions correct</p>
            {!result.passed && (
              <p className="quiz-result-hint">
                You need 70% to pass. Try again!
              </p>
            )}
          </div>
          {result.passed && (
            <p className="quiz-result-auto">Completing topic...</p>
          )}
          {!result.passed && (
            <div className="quiz-result-actions">
              <button
                className="quiz-btn quiz-btn-retry"
                onClick={() => {
                  setResult(null)
                  setCurrentQuestion(0)
                  setSelectedAnswers(new Array(questions.length).fill(null))
                  setError(null)
                }}
              >
                Retry Quiz
              </button>
              <button
                className="quiz-btn quiz-btn-skip"
                onClick={() => onSkip()}
              >
                Skip for Now
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="quiz-error">{error || 'No questions available'}</div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const answered = selectedAnswers[currentQuestion] !== null

  return (
    <div className="quiz-container">
      <div className="quiz-card">
        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-progress">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Section */}
        <div className="quiz-question-section">
          <div className="quiz-video-container">
            <div className="quiz-question-display">
              🎯 {question.question}
            </div>
          </div>
          <div className="quiz-question-text">
            Select the correct meaning of the ISL gesture
          </div>
        </div>

        {/* Options */}
        <div className="quiz-options">
          {question.options.map((option, idx) => (
            <div
              key={idx}
              className={`quiz-option ${selectedAnswers[currentQuestion] === idx ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(idx)}
            >
              <div className="quiz-option-letter">
                {String.fromCharCode(65 + idx)}
              </div>
              <div className="quiz-option-text">
                {option.text}
              </div>
              {selectedAnswers[currentQuestion] === idx && (
                <div className="quiz-option-check">✓</div>
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && <div className="quiz-error">{error}</div>}

        {/* Navigation */}
        <div className="quiz-navigation">
          <button
            className="quiz-btn quiz-btn-secondary"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            ← Previous
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              className="quiz-btn quiz-btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !answered}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              className="quiz-btn quiz-btn-secondary"
              onClick={handleNext}
              disabled={!answered}
            >
              Next →
            </button>
          )}
        </div>

        {/* Answered status */}
        <div className="quiz-answered-indicator">
          {selectedAnswers.filter(ans => ans !== null).length} of {questions.length} answered
        </div>
      </div>
    </div>
  )
}
