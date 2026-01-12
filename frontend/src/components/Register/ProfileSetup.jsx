import React, { useState, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../../context/AuthContext'
import './ProfileSetup.css'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setState: setAuthState } = useContext(AuthContext)
  
  // Get user info from navigation state
  const user = location.state?.user

  const [formData, setFormData] = useState({
    avatarGender: '', // 'male' or 'female'
    dailyGoalMinutes: '' // learning goal in minutes
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Redirect if no user data
  if (!user) {
    navigate('/register')
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleAvatarSelect = (gender) => {
    setFormData(prev => ({ ...prev, avatarGender: gender }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.avatarGender) {
      setError('Please select an avatar gender')
      return
    }

    if (!formData.dailyGoalMinutes) {
      setError('Please enter your daily learning goal')
      return
    }

    const goalMinutes = parseInt(formData.dailyGoalMinutes, 10)
    if (isNaN(goalMinutes) || goalMinutes < 1 || goalMinutes > 480) {
      setError('Daily goal must be between 1 and 480 minutes (8 hours)')
      return
    }

    setLoading(true)

    try {
      console.log('Sending profile setup request with:', { 
        avatarGender: formData.avatarGender, 
        dailyGoalMinutes: goalMinutes 
      });
      
      // Update user profile with avatar gender and daily goal
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user_stats`,
        {
          avatarGender: formData.avatarGender,
          dailyGoalMinutes: goalMinutes
        },
        { withCredentials: true }
      )

      console.log('Profile setup successful:', res.data)

      // Update auth context with new user data
      if (setAuthState && res.data.user) {
        setAuthState({ authenticated: true, user: res.data.user, loading: false })
      }

      // Navigate to dashboard
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Profile setup error:', err)
      const msg = err.response?.data?.message || 'Failed to set up profile. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-box">
        <div className="profile-setup-header">
          <h1 className="profile-setup-title">Welcome to ISL Academy! 🎓</h1>
          <p className="profile-setup-subtitle">Let's set up your profile</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-setup-form">
          {/* Avatar Gender Selection */}
          <div className="form-section">
            <label className="form-label">Select Your Avatar Gender</label>
            <p className="form-hint">Choose which avatar style you prefer</p>
            
            <div className="avatar-selector">
              <button
                type="button"
                className={`avatar-option ${formData.avatarGender === 'male' ? 'selected' : ''}`}
                onClick={() => handleAvatarSelect('male')}
              >
                <div className="avatar-icon male-avatar">👨</div>
                <span className="avatar-label">Male</span>
              </button>

              <button
                type="button"
                className={`avatar-option ${formData.avatarGender === 'female' ? 'selected' : ''}`}
                onClick={() => handleAvatarSelect('female')}
              >
                <div className="avatar-icon female-avatar">👩</div>
                <span className="avatar-label">Female</span>
              </button>
            </div>
          </div>

          {/* Daily Learning Goal */}
          <div className="form-section">
            <label htmlFor="dailyGoal" className="form-label">Daily Learning Goal (minutes)</label>
            <p className="form-hint">How many minutes per day do you want to learn?</p>
            
            <div className="goal-input-wrapper">
              <input
                type="number"
                id="dailyGoal"
                name="dailyGoalMinutes"
                placeholder="e.g., 30"
                value={formData.dailyGoalMinutes}
                onChange={handleChange}
                min="1"
                max="480"
                required
                className="form-input"
              />
              <span className="goal-unit">minutes</span>
            </div>

            <div className="goal-suggestions">
              <p className="suggestions-label">Quick suggestions:</p>
              <div className="suggestion-buttons">
                <button
                  type="button"
                  className="suggestion-btn"
                  onClick={() => setFormData(prev => ({ ...prev, dailyGoalMinutes: '15' }))}
                >
                  15 min
                </button>
                <button
                  type="button"
                  className="suggestion-btn"
                  onClick={() => setFormData(prev => ({ ...prev, dailyGoalMinutes: '30' }))}
                >
                  30 min
                </button>
                <button
                  type="button"
                  className="suggestion-btn"
                  onClick={() => setFormData(prev => ({ ...prev, dailyGoalMinutes: '45' }))}
                >
                  45 min
                </button>
                <button
                  type="button"
                  className="suggestion-btn"
                  onClick={() => setFormData(prev => ({ ...prev, dailyGoalMinutes: '60' }))}
                >
                  60 min
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="profile-setup-btn"
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Complete Profile & Continue'}
          </button>
        </form>

        <p className="profile-setup-footer">
          You can change these settings anytime in your account preferences.
        </p>
      </div>
    </div>
  )
}
