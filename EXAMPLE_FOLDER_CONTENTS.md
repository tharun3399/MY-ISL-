# Example Folder Contents - ISL Galaxy Voyager

**Project Name:** ISL Galaxy Voyager  
**Description:** An immersive, galaxy-themed dashboard for learning Indian Sign Language (ISL), featuring gamified progress tracking, AI tutoring, and interactive lesson modules.  
**Type:** TypeScript + React 19 + Vite  
**Framework:** AI Studio (Google Gemini AI Integration)

---

## Project Structure

```
example/
├── components/          # React components
│   ├── CosmicTutor.tsx
│   ├── Dashboard.tsx
│   ├── LessonView.tsx
│   ├── PracticeArena.tsx
│   ├── ProgressChart.tsx
│   ├── Sidebar.tsx
│   └── StarBackground.tsx
├── context/             # React context providers
│   └── UserContext.tsx
├── services/            # API services
│   └── geminiService.ts
├── App.tsx              # Main app component
├── index.tsx            # Entry point
├── types.ts             # TypeScript type definitions
├── constants.ts         # Constants and mock data
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies
├── index.html           # HTML template
├── .env.local           # Environment variables (local)
├── .gitignore           # Git ignore rules
├── metadata.json        # App metadata
└── README.md            # Documentation
```

---

## Key Files Content

### `package.json`
```json
{
  "name": "isl-galaxy-voyager",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.1",
    "@google/genai": "^1.31.0",
    "react-hot-toast": "^2.6.0",
    "react-dom": "^19.2.1",
    "react-router-dom": "^7.10.1",
    "recharts": "^3.5.1",
    "lucide-react": "^0.556.0"
  },
  "devDependencies": {
    "typescript": "~5.8.2",
    "vite": "^6.2.0",
    "@vitejs/plugin-react": "^5.0.0"
  }
}
```

### `types.ts`
Defines TypeScript interfaces:
- **Lesson** - Lesson object with id, title, description, category, difficulty, progress, locked, xpReward, imageUrl
- **UserStats** - User profile with name, level, rank, xp, streak, signsLearned
- **ChatMessage** - Message interface with id, role, text, timestamp
- **GameState** - Enum for game states (IDLE, PRACTICING, SUCCESS, FAILED)

### `constants.ts`
- **NAV_ITEMS** - Navigation menu items (Home, Lessons, Practice Arena, Cosmic Tutor, Achievements, Settings)
- **MOCK_USER** - Sample user data (Alex, Level 5, 2450 XP, 12-day streak)
- **MOCK_LESSONS** - Array of 4 sample lessons with different categories and difficulties

### `App.tsx`
Main application component:
- Uses React Router for navigation
- HashRouter-based routing (suitable for single-page apps)
- Sidebar navigation with toggle functionality
- Toast notifications via react-hot-toast
- Starfield background animation
- Routes:
  - `/` - Dashboard
  - `/lessons` - Lesson View
  - `/practice` - Practice Arena
  - `/tutor` - Cosmic Tutor
  - `*` - Redirect to home

### `index.html`
- Uses Tailwind CSS CDN for styling
- Custom Tailwind theme configuration with galaxy colors
- Galaxy color scheme:
  - Deep space: `#0B0B1E`
  - Dark nebula: `#141432`
  - Cyan glow: `#00F0FF`
  - Purple glow: `#7000FF`
- Custom scrollbar styling
- Animations: float, pulse-slow, twinkle
- Imports dependencies from AI Studio CDN

### `index.tsx`
Entry point:
- Renders React 19 app
- Mounts to #root element
- Uses StrictMode for development warnings

### `vite.config.ts`
```typescript
- Port: 3000
- Host: 0.0.0.0
- React plugin enabled
- Environment variables: GEMINI_API_KEY
- Path alias: @ = ./
```

### `tsconfig.json`
- Target: ES2022
- JSX: react-jsx
- Module: ESNext
- Strict type checking with skipLibCheck
- Path aliases configured for @ imports

### `metadata.json`
```json
{
  "name": "ISL Galaxy Voyager",
  "description": "An immersive, galaxy-themed dashboard...",
  "requestFramePermissions": ["camera"]
}
```

### `.env.local`
```dotenv
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

---

## Components

### **Dashboard.tsx**
Main dashboard page showing:
- Mission Control header with user greeting
- Current objective card with lesson image and progress bar
- Continue Mission button
- Streak counter and XP display
- Activity Log with ProgressChart
- Daily Signal challenge card
- Recommended Sectors grid (4 lesson previews)

### **Sidebar.tsx**
Navigation sidebar with:
- Logo/branding
- Menu items from constants
- Collapsible/toggle functionality
- Icons from lucide-react

### **StarBackground.tsx**
Animated starfield background component

### **LessonView.tsx**
Lesson listing and selection interface

### **PracticeArena.tsx**
Interactive practice mode for learning signs

### **CosmicTutor.tsx**
AI-powered tutoring interface using Gemini

### **ProgressChart.tsx**
Visual progress tracking using Recharts

---

## Context

### **UserContext.tsx**
```typescript
interface UserContextType {
  user: UserStats;
  lessons: Lesson[];
  updateProgress: (lessonId: string, progress: number) => void;
  addXp: (amount: number) => void;
}
```
- Provides user state management
- Manages lesson progress
- Handles XP rewards
- useUser() hook for component access

---

## Services

### **geminiService.ts**
Google Gemini AI integration:
- Function: `chatWithTutor(message: string, history: [])`
- Model: `gemini-2.5-flash`
- System Instruction: "Nova" - AI tutor personality
- Features:
  - Explains ISL signs vividly
  - Describes handshapes, movements, facial expressions
  - Uses space metaphors
  - Fallback response if API key missing
  - Error handling for API failures

---

## Styling & Theme

### Galaxy Color Scheme
- **Primary Background:** `#0B0B1E` (Deep space)
- **Secondary Background:** `#141432` (Dark nebula)
- **Accent Colors:**
  - Cyan: `#00F0FF` (primary glow)
  - Purple: `#7000FF` (secondary glow)
- **Text:** Slate-100 (light gray)
- **Glass Effect:** `rgba(255, 255, 255, 0.05)` with borders at `0.1` opacity

### Custom Animations
- **float** - Vertical floating animation (6s)
- **pulse-slow** - Slow pulsing effect (4s)
- **twinkle** - Star twinkling (3s)

### Typography
- **Display Font:** Space Grotesk (headings)
- **Body Font:** Inter (text)
- Custom scrollbar with purple hover state

---

## Features

✅ **Gamified Learning**
- XP reward system
- Streak tracking
- Level progression
- Rank system

✅ **Interactive Components**
- Progress charts with Recharts
- Lesson cards with images
- Practice arena
- AI tutoring interface

✅ **Galaxy Theme**
- Immersive dark space aesthetic
- Neon cyan and purple accents
- Animated starfield background
- Glass-morphism UI elements

✅ **AI Integration**
- Google Gemini API for tutoring
- Natural language explanations
- ISL-specific context

✅ **Mobile Responsive**
- Tailwind breakpoints (md, lg)
- Flexible grid layouts
- Collapsible sidebar

---

## Getting Started

### Prerequisites
- Node.js

### Installation
```bash
npm install
```

### Configuration
1. Set `GEMINI_API_KEY` in `.env.local`
2. Get API key from Google AI Studio

### Development
```bash
npm run dev
```
Server runs on `http://localhost:3000`

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

---

## Navigation Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | Dashboard | Main landing page with lessons overview |
| `/lessons` | LessonView | Browse and select lessons |
| `/practice` | PracticeArena | Practice ISL signs |
| `/tutor` | CosmicTutor | AI tutoring interface |

---

## Key Technologies

- **React 19.2.1** - Latest React version with auto-batching
- **TypeScript 5.8** - Type safety
- **Vite 6.2** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS
- **React Router 7.10** - Client-side routing
- **Recharts 3.5** - Chart library
- **Lucide React 0.556** - Icon library
- **Google Generative AI** - LLM integration
- **React Hot Toast** - Toast notifications

---

## Notes

- This is a frontend-only application (UI/UX focused)
- Requires separate backend for user data persistence
- Gemini API key required for AI tutor functionality
- Uses AI Studio for deployment and management
- Camera permission requested for potential AR/video features
- Fallback responses when API key is missing (for demo purposes)

---

**End of ISL Galaxy Voyager Documentation**
