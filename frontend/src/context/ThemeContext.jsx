import React, { createContext, useState, useContext } from 'react'
import { useLocation } from 'react-router-dom'

// Create Theme Context
const ThemeContext = createContext()

// Theme definitions
const themes = {
  dark: {
    name: 'Dark',
    bgDark: '#0a0e27',
    bgDarkSecondary: '#1a1f3a',
    cardBg: 'rgba(15, 20, 40, 0.8)',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(200, 220, 255, 0.8)',
    accent: '#00ff7f',
    accentCyan: '#00d9ff',
    accentPink: '#ff006e',
    borderColor: 'rgba(0, 217, 255, 0.15)',
    gradient: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
  },
  light: {
    name: 'Light',
    bgDark: '#ffffff',
    bgDarkSecondary: '#f5f5f5',
    cardBg: 'rgba(255, 255, 255, 0.95)',
    textPrimary: '#1a1a1a',
    textSecondary: 'rgba(50, 50, 50, 0.7)',
    accent: '#2dae6e',
    accentCyan: '#0099cc',
    accentPink: '#ff1493',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
  },
  ocean: {
    name: 'Ocean',
    bgDark: '#0d1b2a',
    bgDarkSecondary: '#1b263b',
    cardBg: 'rgba(27, 38, 59, 0.9)',
    textPrimary: '#e0f4ff',
    textSecondary: 'rgba(224, 244, 255, 0.7)',
    accent: '#00d9ff',
    accentCyan: '#00b4d8',
    accentPink: '#ffa300',
    borderColor: 'rgba(0, 217, 255, 0.2)',
    gradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
  },
  sunset: {
    name: 'Sunset',
    bgDark: '#2d1b00',
    bgDarkSecondary: '#4a2c1a',
    cardBg: 'rgba(74, 44, 26, 0.9)',
    textPrimary: '#ffd700',
    textSecondary: 'rgba(255, 215, 0, 0.8)',
    accent: '#ff6b35',
    accentCyan: '#ffa500',
    accentPink: '#ff4500',
    borderColor: 'rgba(255, 107, 53, 0.2)',
    gradient: 'linear-gradient(135deg, #2d1b00 0%, #4a2c1a 100%)',
  },
}

// Theme Provider Component
export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('dark')
  const location = useLocation()

  // Pages that should NOT have theme applied
  const excludedRoutes = ['/', '/login', '/register']

  const applyTheme = (themeName) => {
    setCurrentTheme(themeName)
    const theme = themes[themeName]
    const root = document.documentElement

    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })

    // Save theme to localStorage
    localStorage.setItem('selectedTheme', themeName)
  }

  // Load saved theme on mount and when route changes
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark'
    const theme = themes[savedTheme]
    const root = document.documentElement

    // If on excluded routes, clear theme variables so hardcoded colors show
    if (excludedRoutes.includes(location.pathname)) {
      Object.keys(themes.dark).forEach((key) => {
        root.style.removeProperty(`--${key}`)
      })
      setCurrentTheme(savedTheme)
      return
    }

    // Apply theme to all other pages
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })

    setCurrentTheme(savedTheme)
  }, [location.pathname])

  return (
    <ThemeContext.Provider value={{ currentTheme, applyTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
