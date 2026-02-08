import React, { useState, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
// src/axiosConfig.js
import axios from 'axios';

//axios.defaults.baseURL = process.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true; // << important: send cookies automatically

import './LoginPage.css'
import { AuthContext } from '../../context/AuthContext' // adjust path if needed
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

function SocialButton({ children, onClick, className }) {
  return (
    <button type="button" className={`social-btn ${className || ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.from?.pathname || '/dashboard'

  // auth context: set auth state after login
  const { setState: setAuthState } = useContext(AuthContext)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // POST to your server's login route.
      // withCredentials:true is required if server sets httpOnly cookie
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      )

      // login success — server returns minimal user info in body (or cookie)
      const user = res.data.user || res.data // adapt to your server response shape

      // update global auth state so RequireAuth and other components know we're logged in
      if (setAuthState) {
        setAuthState({ authenticated: true, user, loading: false })
      }

      console.log('Login success:', res.data)

      // navigate back to where the user wanted to go (or dashboard)
      navigate(returnTo, { replace: true })
    } catch (err) {
      console.error('Login failed', err)
      const msg = err.response?.data?.message || err.message || 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function forgotPassword(e) {
    e.preventDefault()
    alert('Password reset link has been sent to your email.')
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError(null)
    setLoading(true)
    try {
      // Decode the JWT to get user data
      const decoded = jwtDecode(credentialResponse.credential)

      // Send to backend login endpoint with Google data
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`,
        {
          email: decoded.email,
          google_id: decoded.sub,
          is_google_auth: true,
        },
        { withCredentials: true }
      )

      // Update auth context
      const user = res.data.user || res.data
      if (setAuthState) {
        setAuthState({ authenticated: true, user, loading: false })
      }

      console.log('Google login success:', res.data)

      // Redirect to dashboard
      navigate(returnTo, { replace: true })
    } catch (err) {
      console.error('Google login failed:', err)
      const msg = err.response?.data?.message || err.message || 'Google login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (e) => {
    e.preventDefault()
    setShowPassword(!showPassword)
  }

  return (
    <div className="page-bg">
      <div className="login-box">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to your account</p>

        <form className="form" onSubmit={handleLogin}>
              <input
                className="input"
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div style={{ width: '100%' }}>
                <div className="password-input-wrapper">
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="password-toggle-btn"
                    onClick={togglePasswordVisibility}
                    type="button"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '🔒'}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div className="input-help">Use at least 8 characters. Avoid common words.</div>
                  <button className="forgot" onClick={forgotPassword} type="button">Forgot?</button>
                </div>
              </div>

              {error && <div style={{ color: 'red', margin: '8px 0' }}>{error}</div>}

              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="divider"><span>or</span></div>

              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed. Please try again.')}
                />
              </div>

              <div className="footer">
                Don't have an account?
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register') }}>
                  Sign up
                </a>
              </div>
        </form>
      </div>
    </div>
  )
}
