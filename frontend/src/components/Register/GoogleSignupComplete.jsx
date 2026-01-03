import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import './GoogleSignupComplete.css'

export default function GoogleSignupComplete() {
  const navigate = useNavigate()
  const location = useLocation()
  const googleData = location.state?.googleData

  const [formData, setFormData] = useState({
    username: googleData?.name?.toLowerCase().replace(/\s+/g, '') || '', // Auto-populate from Google name
    phone: '',
    name: googleData?.name || '',
    password: '',
    confirmPassword: '',
    showPassword: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Redirect if no google data
  if (!googleData) {
    navigate('/register')
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.username.trim()) {
        setError('Username is required')
        setLoading(false)
        return
      }

      if (!formData.phone.trim()) {
        setError('Phone number is required')
        setLoading(false)
        return
      }

      if (!formData.password.trim()) {
        setError('Password is required')
        setLoading(false)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      // Password validation: 8+ chars with uppercase, lowercase, number, special char
      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
      if (!pwdRegex.test(formData.password)) {
        setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&#)')
        setLoading(false)
        return
      }

      // Phone validation
      const phoneRegex = /^\+?[0-9]{8,15}$/
      if (!phoneRegex.test(formData.phone)) {
        setError('Please enter a valid phone number')
        setLoading(false)
        return
      }

      // Create user with Google data AND custom password
      const registrationData = {
        name: formData.name || formData.username,
        email: googleData.email,
        phone: formData.phone,
        username: formData.username,
        password: formData.password, // Use user-provided password
        confirmPassword: formData.confirmPassword,
        isGoogleAuth: true,
        googleId: googleData.googleId,
        googlePicture: googleData.picture
      }

      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, registrationData)
      console.log('Registration successful:', res.data)

      // Navigate to profile setup page instead of auto-login
      navigate('/register/profile-setup', { 
        state: { user: res.data.user || res.data },
        replace: true 
      })
    } catch (err) {
      console.error('Registration error:', err)
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="google-complete-container">
      <div className="google-complete-box">
        <div className="google-complete-header">
          {googleData.picture && (
            <img src={googleData.picture} alt={googleData.name} className="google-avatar" />
          )}
          <h1 className="google-complete-title">Complete Your Profile</h1>
          <p className="google-complete-subtitle">
            Welcome {googleData.name}! Please add your details to complete registration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="google-complete-form">
          {/* Email (read-only) */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={googleData.email}
              disabled
              className="form-input disabled-input"
            />
            <small className="form-hint">Verified with Google</small>
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="form-input"
              required
            />
          </div>

          {/* Username */}
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              className="form-input"
              required
            />
            <small className="form-hint">This will be your public username</small>
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              className="form-input"
              pattern="[0-9+\-\s]{8,}"
              required
            />
            <small className="form-hint">8-15 digits with optional + prefix</small>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={formData.showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                className="form-input"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                title={formData.showPassword ? 'Hide password' : 'Show password'}
              >
                {formData.showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <small className="form-hint">Min 8 chars: uppercase, lowercase, number, special char (@$!%*?&#)</small>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={formData.showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className="form-input"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                title={formData.showPassword ? 'Hide password' : 'Show password'}
              >
                {formData.showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="complete-btn"
            disabled={loading}
          >
            {loading ? 'Completing Registration...' : 'Complete Registration'}
          </button>
        </form>

        <div className="complete-footer">
          <p>
            Don't want to continue?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="back-link"
            >
              Go back to registration
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
