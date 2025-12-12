import React, { createContext, useEffect, useState, useRef } from 'react'
import axios from 'axios'

export const AuthContext = createContext({ authenticated: false, user: null })

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export function AuthProvider({ children }) {
  const [state, setState] = useState({ authenticated: false, user: null, loading: true })
    // Check authentication status on mount
    useEffect(() => {
      const checkAuth = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/profile`, { withCredentials: true })
          if (res.data && res.data.user) {
            setState({ authenticated: true, user: res.data.user, loading: false })
          } else {
            setState({ authenticated: false, user: null, loading: false })
          }
        } catch (err) {
          setState({ authenticated: false, user: null, loading: false })
        }
      }
      checkAuth()
    }, [])
  const inactivityTimerRef = useRef(null)
  const isAuthenticatedRef = useRef(false)


  // Update ref whenever state changes
  useEffect(() => {
    isAuthenticatedRef.current = state.authenticated
    if (state.authenticated) {
      startInactivityTimer()
    }
  }, [state.authenticated])

  // Inactivity timeout logic
  const startInactivityTimer = () => {
    // Clear any existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    // Set new timer for 10 minutes of inactivity
    inactivityTimerRef.current = setTimeout(() => {
      console.log('User inactive for 10 minutes, logging out...')
      logout()
    }, INACTIVITY_TIMEOUT)
  }

  // Reset inactivity timer on user activity
  const resetInactivityTimer = () => {
    if (isAuthenticatedRef.current) {
      startInactivityTimer()
    }
  }

  // Track user activity
  useEffect(() => {
    if (!state.authenticated) return

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer)
    })

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer)
      })
    }
  }, [state.authenticated])

  const logout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/logout`, {}, { withCredentials: true })
    } catch (err) {
      console.warn('Logout error:', err.message)
    }
    setState({ authenticated: false, user: null, loading: false })
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
  }

  // Wrapper for setState that also manages inactivity timer
  const setAuthState = (newState) => {
    setState(newState)
    if (newState.authenticated) {
      startInactivityTimer()
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, authState: state, setState: setAuthState, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
