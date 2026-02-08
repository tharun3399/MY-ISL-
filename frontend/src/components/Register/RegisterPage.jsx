import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { AuthContext } from '../../context/AuthContext'
import './RegisterPage.css'
import axios from 'axios'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setState: setAuthState } = useContext(AuthContext)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  // optional: basic client-side validation example
  if (!formData.email || !formData.name) {
    alert('Name and email are required');
    return;
  }

  try {
    console.log('Registering user with', formData);
    const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, formData);
    console.log('Registration successful:', res.data);
    
    // Auto-login the user after registration
    try {
      const loginRes = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`,
        {
          email: formData.email,
          password: formData.password
        },
        { withCredentials: true }
      );
      
      console.log('Auto-login response:', loginRes.data);
      console.log('Login cookies set');
      
      // Update auth context - use the proper setState method
      if (setAuthState) {
        setAuthState({ authenticated: true, user: loginRes.data.user, loading: false });
        console.log('Auth state updated');
      }
      
      // Add small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Navigating to profile setup');
      // Navigate to profile setup page with user data and authenticated
      navigate('/register/profile-setup', { state: { user: loginRes.data.user } });
    } catch (loginErr) {
      console.error('Auto-login failed:', loginErr);
      console.error('Login error response:', loginErr.response?.data);
      // If auto-login fails, still allow profile setup with registration data
      navigate('/register/profile-setup', { state: { user: res.data.user || res.data } });
    }
  } catch (err) {
    console.error('Registration error:', err);
    const msg = err.response?.data?.message || 'Registration failed. Please try again.';
    alert(msg);
  }
};

  const togglePasswordVisibility = (e) => {
    e.preventDefault()
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = (e) => {
    e.preventDefault()
    setShowConfirmPassword(!showConfirmPassword)
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google Sign-Up:', credentialResponse)
      
      // Decode Google token
      const decoded = jwtDecode(credentialResponse.credential)
      const googleData = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        googleId: decoded.sub
      }

      // First, try to login if user already exists
      try {
        const loginRes = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`,
          {
            email: googleData.email,
            google_id: googleData.googleId,
            is_google_auth: true
          },
          { withCredentials: true }
        )

        // User already exists - login successful
        const user = loginRes.data.user
        if (setAuthState) {
          setAuthState({ authenticated: true, user, loading: false })
        }
        console.log('User already exists, logged in:', loginRes.data)
        navigate('/dashboard', { replace: true })
      } catch (loginErr) {
        // User doesn't exist - go to completion form
        console.log('Login error status:', loginErr.response?.status)
        console.log('Login error data:', loginErr.response?.data)
        if (loginErr.response?.status === 401) {
          console.log('User does not exist, going to completion form')
          navigate('/register/complete', {
            state: { googleData }
          })
        } else {
          console.error('Unexpected login error:', loginErr)
          throw loginErr
        }
      }
    } catch (err) {
      console.error('Google Sign-Up error:', err)
      alert('Google Sign-Up failed. Please try again.')
    }
  }

  const handleGoogleError = () => {
    console.log('Google Sign-Up failed')
    alert('Google Sign-Up failed. Please try again.')
  }

  return (
    <div className="register-container">
      <div className="register-box">
        <h1 className="register-title">Create Account</h1>

        <form onSubmit={handleRegister} className="register-form">
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
              className="form-input"
              pattern="[0-9]{10,15}"
              title="Please enter a valid phone number"
            />
          </div>

          <div className="form-group">
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
              />
              <button 
                className="password-toggle-btn" 
                onClick={togglePasswordVisibility}
                type="button"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "🔒"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="form-input"
              />
              <button 
                className="password-toggle-btn" 
                onClick={toggleConfirmPasswordVisibility}
                type="button"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? "👁️" : "🔒"}
              </button>
            </div>
          </div>

          <button type="submit" className="register-btn">Create Account</button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="google-signup">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signup_with"
            theme="dark"
            locale="en"
          />
        </div>

        <div className="register-footer">
          <p>Already have an account? <button onClick={() => navigate('/login')} className="sign-in-link">Sign in</button></p>
        </div>
      </div>
    </div>
  )
}
