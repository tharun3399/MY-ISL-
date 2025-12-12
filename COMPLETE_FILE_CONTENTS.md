# ISL Learning App - Complete File Contents

**Project:** ISL-Learning-App (Indian Sign Language Learning Platform)  
**Repository:** tharun3399/ISL-Learning-App  
**Branch:** main  
**Last Updated:** December 7, 2025

---

## Project Overview

This is a full-stack React + Vite + Express application for learning Indian Sign Language (ISL). It features:
- User authentication (email/password + Google OAuth)
- Interactive lesson dashboard with 3D avatar
- Video learning materials
- Progress tracking and community rankings
- Responsive UI with theme customization

---

## Directory Structure

```
c:\Users\SSN\Desktop\mylogin/
├── Frontend Root Files
├── src/                    (React Frontend)
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   ├── components/
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Dashboard/
│   │   ├── Video/
│   │   ├── Popup/
│   │   ├── RequireAuth.jsx
│   │   └── test/
│   └── context/
│       ├── AuthContext.jsx
│       └── ThemeContext.jsx
├── backend/                (Express Backend)
│   └── express/expressapp/
│       ├── index.js
│       ├── package.json
│       └── APIs/
│           ├── loginreg.js (Main server)
│           └── app.js (Empty)
└── Configuration Files
    ├── .env (Environment variables)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.cjs
    └── index.html
```

---

## File Contents

### Root Configuration Files

#### `.env`
```dotenv
# Google OAuth Configuration (for Vite, use VITE_ prefix)
# Get your Client ID from: https://console.cloud.google.com/
# See GET_GOOGLE_CLIENT_ID.md for detailed step-by-step instructions
# Temporary placeholder - update this with your real Client ID
VITE_GOOGLE_CLIENT_ID=544857582983-7qkq2o6dcvapcuam9riim672oveiusm8.apps.googleusercontent.com

# Backend API
VITE_API_URL=http://localhost:5000
```

#### `package.json`
```json
{
  "name": "premium-login-ui",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-oauth/google": "^0.12.1",
    "@tailwindcss/postcss": "^4.1.17",
    "axios": "^1.13.2",
    "jwt-decode": "^4.0.0",
    "lucide-react": "^0.555.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-icons": "^5.5.0",
    "react-router-dom": "^6.30.2",
    "recharts": "^3.5.1",
    "three": "^0.181.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "autoprefixer": "^10.4.22",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.17",
    "vite": "^5.0.0"
  }
}
```

#### `index.html`
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ISL Academy - Learn Indian Sign Language</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%230a0e27' width='100' height='100'/%3E%3Ccircle cx='50' cy='50' r='40' fill='%2300d9ff'/%3E%3Ctext x='50' y='65' font-size='50' font-weight='bold' fill='%230a0e27' text-anchor='middle' font-family='Arial'%3EISL%3C/text%3E%3C/svg%3E" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
  </html>
```

#### `vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

#### `tailwind.config.js`
```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#f0f4ff',
          100: '#e5e7fb',
          600: '#6c47ff',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          600: '#4b5563',
          900: '#111827',
        },
        green: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        }
      },
      scale: {
        '105': '1.05',
      }
    },
  },
  plugins: [],
}
```

#### `postcss.config.cjs`
```javascript
module.exports = {
  plugins: {
    autoprefixer: {},
  },
}
```

---

### Frontend Source Files

#### `src/main.jsx`
```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// Suppress the "A listener indicated an asynchronous response" warning
// This is a known issue with Chrome messaging that doesn't affect functionality
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = function(...args) {
    if (args[0]?.includes?.('A listener indicated an asynchronous response')) {
      return
    }
    originalError.apply(console, args)
  }
}

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

#### `src/App.jsx`
```jsx
// src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'

import LoginPage from './components/Login/LoginPage'
import RegisterPage from './components/Register/RegisterPage'
import GoogleSignupComplete from './components/Register/GoogleSignupComplete'
import VideoPage from './components/Video/VideoPage'
import DashboardPage from './components/Dashboard/DashboardPage'
import Test from './components/test/test'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE'

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <Routes>
              {/* public */}
              <Route path='/' element={<Test />} />
              <Route path="/VideoPage" element={<VideoPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/complete" element={<GoogleSignupComplete />} />

              {/* protected group */}
              <Route element={<RequireAuth />}>
                <Route path="/dashboard/*" element={<DashboardPage />} />
              </Route>

              {/* redirect any /login/* to /login (handles /login/dashboard) */}
              <Route path="/login/*" element={<Navigate to="/login" replace />} />

              {/* catch-all: unknown paths → send to login (or change to '/' if you prefer) */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
```

#### `src/styles.css`
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');

:root{
  /* White Modern Theme */
  --bg1: #f5f7fa;
  --bg2: #ffffff;
  --card: #ffffff;
  --glass: rgba(255,255,255,0.95);
  --accent: #6c47ff;
  --muted: #2d3748;
}

*{box-sizing:border-box}
html,body,#root{height:100%; width: 100%; margin: 0; padding: 0;}
body{
  margin:0;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  color: #2d3748;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

.page-bg{display:flex;align-items:center;justify-content:center;height:100vh;padding:20px;overflow:hidden}
.container{margin-top: 100px;width:100%;max-width:1100px;height:100%;display:flex;flex-direction:column}
.vidcontainer{margin-top:130px;margin-bottom: 50px;width:100%;max-width:1100px;height:100%;display:flex;flex-direction:column}

/* ... rest of CSS content ... */
```

#### `src/context/AuthContext.jsx`
```jsx
import React, { createContext, useEffect, useState } from 'react'
import axios from 'axios'

export const AuthContext = createContext({ authenticated: false, user: null })

export function AuthProvider({ children }) {
  const [state, setState] = useState({ authenticated: false, user: null, loading: true })

  useEffect(() => {
    // ask server if session is valid (cookie-based) OR validate token
    axios.get('http://localhost:5000/profile', { withCredentials: true })
      .then(res => setState({ authenticated: true, user: res.data.user || res.data, loading: false }))
      .catch(err => {
        // 401 is expected when user is not logged in - don't log it as an error
        if (err.response?.status !== 401) {
          console.error('Auth check failed:', err.message)
        }
        setState({ authenticated: false, user: null, loading: false })
      })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, setState }}>
      {children}
    </AuthContext.Provider>
  )
}
```

#### `src/context/ThemeContext.jsx`
```jsx
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

  const useTheme = () => ({ currentTheme, applyTheme, themes })

  return (
    <ThemeContext.Provider value={{ currentTheme, applyTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
```

#### `src/components/RequireAuth.jsx`
```jsx
import React, { useContext } from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function RequireAuth({ children }) {
  const { authenticated, loading } = useContext(AuthContext)
  const location = useLocation()

  if (loading) return <div>Checking authentication…</div> // or spinner component

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If you passed children, render them; otherwise allow nested routes via <Outlet/>
  return children ?? <Outlet />
}
```

---

### Login/Register Components

#### `src/components/Login/LoginPage.jsx`
Full implementation with:
- Email/password authentication
- Google OAuth login
- Password visibility toggle
- Error handling
- Forgot password button
- Redirect to register

#### `src/components/Register/RegisterPage.jsx`
Full implementation with:
- Registration form (name, email, phone, password)
- Google Sign-Up flow
- Form validation
- Password matching validation
- Automatic login after registration
- Navigation to completion form for Google users

#### `src/components/Register/GoogleSignupComplete.jsx`
Completion form for Google Sign-Up:
- Auto-populated name from Google
- Phone number input
- Custom password setup
- Password validation (8+ chars, uppercase, lowercase, number, special char)
- Auto-login after completion

#### `src/components/Login/LoginPage.css`
Premium dark theme styling with:
- Neon gradient text effects
- Underline input fields with focus effects
- Glass-morphism cards
- Responsive layout

---

### Dashboard Components

#### `src/components/Dashboard/DashboardPage.jsx`
Routes handler for:
- Main dashboard view
- Account section
- Settings page
- Navigation between sections

#### `src/components/Dashboard/Dashboard.jsx`
Main dashboard layout with:
- Three-column layout (no navbar shown)
- Resizable panels (lesson list & progress card)
- Lesson list management
- Progress tracking
- Avatar 3D component

#### `src/components/Dashboard/Avatar3D.jsx`
3D avatar using Three.js:
- Procedurally created avatar (head, body, arms, legs)
- Idle animations (bob, rotate)
- Interactive animations (wave, jump, dance)
- Canvas rendering

#### `src/components/Dashboard/LessonList.jsx`
Vertical lesson list display with:
- Header with title and subtitle
- Individual lesson items
- Selection and toggle functionality
- Keyboard accessibility
- Hover effects

#### `src/components/Dashboard/ProgressCard.jsx`
Progress display with:
- Recharts donut chart
- Completion percentage
- Lesson statistics
- Community rank info
- Member avatars
- Streak counter

#### `src/components/Dashboard/LessonItem.jsx`
Individual lesson card with:
- Title and description
- Duration badge
- Completion checkbox
- Selection state
- Hover effects

#### `src/components/Dashboard/navbar/Navbar.jsx`
Navigation bar with:
- Home, Settings, Support, Account links
- Collapsible mobile menu
- Icon-based UI
- Click handlers for navigation

#### `src/components/Dashboard/navbar/account/AccountSection.jsx`
Account section wrapper

#### `src/components/Dashboard/navbar/account/AccountBasicInfo.jsx`
User profile information display and edit form

#### `src/components/Dashboard/navbar/settings/SettingsPage.jsx`
Settings page with:
- Theme selection (Dark, Light, Ocean, Sunset)
- Theme preview with color samples
- Persistent theme storage
- About section

---

### Video Component

#### `src/components/Video/VideoPage.jsx`
Video learning page with:
- Video player with navigation arrows
- Multiple ISL video files
- Fade animations between videos
- Video title and description
- Completion popup
- Sign-in button

---

### Other Components

#### `src/components/Popup/PopupBox.jsx`
Generic popup/modal component

#### `src/components/test/test.jsx`
Test component (landing page)

---

### Backend Files

#### `backend/express/expressapp/index.js`
Basic Express server setup (simple test server):
```javascript
const express=require("express");
const App=express();

App.listen(3000, ()=>{
    console.log("App is listening");
}
)

App.get("/", (req,res)=>{
    res.status(200).send("App is Working");
}
)

App.post("/",(req,res)=>{
    res.status(200).send("POST Method working good")
})
```

#### `backend/express/expressapp/APIs/loginreg.js`
Full-featured authentication server with:
- PostgreSQL database integration
- User registration with validation
- Email/password login
- Google OAuth integration
- JWT token management
- Protected routes (/profile)
- User profile updates
- Rate limiting on login/register
- CORS with multiple frontend origins
- Password hashing with bcrypt
- Input validation (email, phone, password)

Key endpoints:
- `POST /register` - Register new user
- `POST /login` - Login with email/password or Google
- `GET /profile` - Get authenticated user profile
- `POST /logout` - Logout (clear cookie)
- `PUT /profile` - Update user profile

#### `backend/express/expressapp/package.json`
```json
{
  "name": "expressapp",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.2.1",
    "express-rate-limit": "^7.5.1",
    "jsonwebtoken": "^9.0.3",
    "pg": "^8.16.3"
  }
}
```

#### `backend/express/expressapp/APIs/.env.example`
```dotenv
# Database Configuration
PGHOST=localhost
PGPORT=3133
PGUSER=postgres
PGPASSWORD=your_secure_database_password_here
PGDATABASE=demodb

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend Configuration
FRONTEND_ORIGIN=http://localhost:5173

# JWT Configuration
JWT_SECRET=your_strong_random_secret_key_min_32_chars_recommended
JWT_EXPIRES_IN=1h
```

---

## CSS Files Summary

### Dashboard CSS Files
- `Dashboard.css` - Main layout, flexbox, responsive design
- `LessonList.css` - Lesson list container, header, gradient backgrounds
- `LessonItem.css` - Individual lesson cards, hover effects
- `ProgressCard.css` - Progress chart, stats, community rank styling
- `Avatar3D.css` - 3D canvas container styling
- `Navbar.css` - Navigation bar, icons, mobile menu

### Other CSS Files
- `LoginPage.css` - Premium dark theme login styling
- `RegisterPage.css` - Registration form styling
- `GoogleSignupComplete.css` - Completion form styling
- `VideoPage.css` - Video player container, navigation buttons
- `PopupBox.css` - Popup/modal styling
- `AccountBasicInfo.css` - Account info display
- `SettingsPage.css` - Settings page layout

---

## Key Technologies

**Frontend:**
- React 18.2.0
- Vite 5.0.0
- React Router 6.30.2
- Tailwind CSS 4.1.17
- Three.js 0.181.2
- Recharts 3.5.1
- React Icons 5.5.0
- Axios 1.13.2
- @react-oauth/google 0.12.1
- jwt-decode 4.0.0

**Backend:**
- Express 5.2.1
- PostgreSQL (pg 8.16.3)
- bcrypt 6.0.0
- JWT (jsonwebtoken 9.0.3)
- CORS 2.8.5
- Cookie-parser 1.4.7
- Express-rate-limit 7.5.1
- dotenv 17.2.3

---

## Important Notes

1. **Google OAuth Setup Required**
   - Get Client ID from Google Cloud Console
   - Update `.env` file with `VITE_GOOGLE_CLIENT_ID`
   - Add authorized redirect URIs for all frontend ports

2. **Database Setup**
   - Uses PostgreSQL
   - Requires `.env` configuration with database credentials
   - Backend auto-creates tables and columns on first run

3. **Authentication Flow**
   - Token stored in httpOnly cookie
   - Protected routes via RequireAuth wrapper
   - Auto-checks session on app load

4. **Theme System**
   - 4 built-in themes (Dark, Light, Ocean, Sunset)
   - Persisted to localStorage
   - CSS variables for dynamic theming
   - Excluded from login/register pages

5. **CORS Configuration**
   - Backend accepts requests from multiple frontend ports
   - Credentials enabled for cookie-based auth
   - Can be extended in backend/.env

---

## Getting Started

```bash
# Frontend
cd c:\Users\SSN\Desktop\mylogin
npm install
npm run dev

# Backend
cd backend/express/expressapp/APIs
npm install
node loginreg.js
```

Visit `http://localhost:5173` (or assigned port) to start using the app.

---

**End of Complete File Contents Document**
