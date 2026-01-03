import React from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import App from './App'
import './styles.css'

// Configure axios to always send credentials (cookies)
axios.defaults.withCredentials = true

// Suppress non-critical warnings for better development experience
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = function(...args) {
    // Suppress React DevTools and async response warnings
    if (args[0]?.includes?.('DevTools') || 
        args[0]?.includes?.('A listener indicated an asynchronous response')) {
      return
    }
    originalError.apply(console, args)
  }
  
  const originalWarn = console.warn
  console.warn = function(...args) {
    // Suppress React Router future flag warnings as they're handled
    if (args[0]?.includes?.('Future Flag Warning')) {
      return
    }
    originalWarn.apply(console, args)
  }
}

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
