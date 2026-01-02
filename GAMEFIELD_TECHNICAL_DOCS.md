# GameField Technical Documentation

## Architecture Overview

### Frontend Architecture

```
App.jsx
├── RequireAuth (Protected Routes)
│   ├── GameField/ (Hub)
│   ├── DuelGame/ (1v1)
│   ├── LiveGames/ (Group)
│   ├── BattlesGame/ (Video)
│   └── TrainingMode/ (Practice)
└── Navigation
    └── Sidebar (GameField option added)
```

### Backend Architecture

```
server.js
├── Express app
├── HTTP server
├── Socket.io initialization
│   ├── JWT authentication middleware
│   └── Socket handlers
│       ├── duel.js (1v1 game logic)
│       ├── games.js (Group game logic)
│       ├── battles.js (Video voting logic)
│       └── matchmaker.js (Player pairing)
└── Database connections
```

## Component Details

### GameField.jsx (Hub)

**State Management:**
```javascript
- selectedGame: null // Currently selected game mode
```

**Game Modes:**
```javascript
games = [
  { id: 'duel', name: '⚔️ Duel', ... },
  { id: 'battles', name: '🎯 Battles', ... },
  { id: 'games', name: '🏆 Live Games', ... },
  { id: 'training', name: '📚 Training Mode', ... }
]
```

**Key Functions:**
- `handleGameSelect(gameId)` - Navigate to selected game

### DuelGame.jsx (1v1)

**Game States:**
```javascript
gameState: 'lobby' | 'queue' | 'playing' | 'results'
```

**State Management:**
```javascript
- socket: Socket instance
- matchId: string
- opponent: Object { userId, name, avatar }
- currentQuestion: { text, options[], correct: number }
- questionIndex: number
- timeLeft: number (0-10)
- selectedAnswer: number | null
- score: number
- answers: Object { [questionIndex]: answerIndex }
```

**Socket Events (Emitted):**
```javascript
socket.emit('queue:subscribe', { userId })
socket.emit('duel:answer', { matchId, questionIndex, selectedAnswer })
```

**Socket Events (Listened):**
```javascript
socket.on('matched', payload => { ... })
socket.on('duel:question', data => { ... })
socket.on('duel:reveal', data => { ... })
socket.on('duel:match-end', data => { ... })
```

**Scoring Logic:**
```javascript
Points = timeLeft * 10  // 0-100 per question
Total = points across 5 questions
XP = Score based on win/loss
```

### LiveGames.jsx (Group)

**Game States:**
```javascript
gameState: 'lobby' | 'joining' | 'playing' | 'results'
```

**State Management:**
```javascript
- socket: Socket instance
- gameId: string
- players: Object[]
- leaderboard: Object[] { rank, name, score, xp }
- currentQuestion: Object
- questionIndex: number
- timeLeft: number
- selectedAnswer: number | null
- playerScore: number
- finalRank: number
```

**Socket Events (Emitted):**
```javascript
socket.emit('games:join', { userId })
socket.emit('games:answer', { gameId, questionIndex, selectedAnswer })
```

**Socket Events (Listened):**
```javascript
socket.on('games:joined', payload => { ... })
socket.on('games:started', data => { ... })
socket.on('games:question', data => { ... })
socket.on('games:leaderboard', data => { ... })
socket.on('games:finished', data => { ... })
```

**Scoring Logic:**
```javascript
Base Points = 10 per correct answer
Speed Bonus = Math.max(0, (10 - timeUsed) * 2)
Total Score = Base + Bonus
XP Rewards: 
  - 1st place: 100 XP
  - 2nd place: 60 XP
  - 3rd place: 30 XP
  - Others: 10 XP
```

### BattlesGame.jsx (Video)

**Game States:**
```javascript
gameState: 'lobby' | 'uploading' | 'voting' | 'results'
```

**State Management:**
```javascript
- socket: Socket instance
- battleId: string
- videoFile: File | null
- videoURL: string | null
- submissions: Object[] { id, userId, userName, videoURL }
- votes: Object { [submissionId]: voteCount }
- results: Object { winner, runners, xp }
```

**Socket Events (Emitted):**
```javascript
socket.emit('battles:join', { userId })
socket.emit('battles:submit', { battleId, userId, videoURL, userName })
socket.emit('battles:vote', { battleId, voterId, targetSubmissionId })
```

**Socket Events (Listened):**
```javascript
socket.on('battles:joined', data => { ... })
socket.on('battles:submissions', data => { ... })
socket.on('battles:winner', data => { ... })
```

### TrainingMode.jsx (Practice)

**Game States:**
```javascript
gameState: 'lobby' | 'playing' | 'results'
```

**State Management:**
```javascript
- difficulty: 'beginner' | 'intermediate' | 'advanced'
- currentQuestion: Object
- questionIndex: number
- timeLeft: number (0-15)
- selectedAnswer: number | null
- score: number
- answered: boolean
- totalQuestions: 10
- xpEarned: number
- results: Object { score, accuracy, xp }
```

**Question Pool:**
```javascript
questionPool = {
  'beginner': [10 questions],
  'intermediate': [10 questions],
  'advanced': [10 questions]
}
```

**Scoring Logic:**
```javascript
Points = Math.max(0, timeLeft * 10)  // 0-150 per question
Total Score = sum of all points
XP = Math.ceil(score / 5)
Accuracy = (correct answers / 10) * 100
```

## Socket.io Integration

### Connection Setup

**Frontend:**
```javascript
const socket = io(socketURL, {
  withCredentials: true,
  auth: { token: localStorage.getItem('token') }
})
```

**Backend:**
```javascript
const io = socketIO(server, {
  cors: {
    origin: [...allowedOrigins],
    credentials: true,
    methods: ['GET', 'POST']
  }
})

io.use((socket, next) => {
  const token = socket.handshake.auth.token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.userId = decoded.id
    socket.user = decoded
    next()
  } catch (err) {
    next(new Error('Authentication error'))
  }
})
```

### Handler Registration

```javascript
// In server.js
require('./sockets/duel')(io, db)
require('./sockets/games')(io, db)
require('./sockets/battles')(io, db)
require('./sockets/matchmaker')(io, db)
```

### Event Naming Convention

**Format:** `namespace:action`

**Examples:**
- `queue:subscribe` - Join matchmaking queue
- `duel:answer` - Submit answer in duel
- `games:joined` - Confirmation of joining game
- `battles:vote` - Vote on submission

## CSS Architecture

### GameField.css
- `.gamefield-wrapper` - Main container with sidebar
- `.gamefield-header` - Header section with stats
- `.games-grid` - Game cards grid (responsive)
- `.game-card` - Individual game card
- `.stat-card` - Stats display cards
- Animations: `@keyframes slideIn`, `@keyframes bounce`

### GamePlayArea.css
- `.game-container` - Main game wrapper
- `.game-header` - Game header bar
- `.lobby-screen` - Lobby state styling
- `.game-screen` - Active game state styling
- `.results-screen` - Results state styling
- `.game-progress` - Progress bar
- `.timer` - Timer display
- `.options-grid` - Answer options layout
- `.leaderboard` - Leaderboard display
- `.video-upload-area` - Video upload input
- `.submissions-grid` - Video submissions grid
- `.winner-card` - Winner display
- Responsive breakpoints: `1024px`, `768px`, `480px`

## Database Schema (Expected)

### Game Results Table
```sql
CREATE TABLE game_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES userinfo(id),
  game_type VARCHAR(20),  -- 'duel', 'games', 'battles'
  score INTEGER,
  xp_earned INTEGER,
  players_count INTEGER,
  rank INTEGER,
  match_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### User XP Table
```sql
CREATE TABLE user_xp (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES userinfo(id),
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Error Handling

### Frontend Error Handling
```javascript
// Try-catch in socket handlers
socket.on('error', (error) => {
  console.error('Socket error:', error)
  setError(error.message || 'Connection error')
  // Auto-retry logic recommended
})

// Component-level error states
const [error, setError] = useState(null)
```

### Backend Error Handling
```javascript
socket.on('error', (error) => {
  console.log(`Socket error for user ${socket.userId}:`, error)
  // Send error to client
  socket.emit('error', { message: 'Game error occurred' })
})
```

## Performance Optimizations

### Frontend
1. **Memoization**: Use React.memo for expensive components
2. **Socket Events**: Debounce rapid emissions
3. **State Updates**: Minimize re-renders with useCallback
4. **CSS**: Use GPU-accelerated properties (transform, opacity)
5. **Bundle**: Tree-shake unused dependencies

### Backend
1. **Socket Handlers**: Use namespaces for organization
2. **Database**: Index frequently queried columns
3. **Caching**: Cache question pools in memory
4. **Broadcasting**: Use room-based events for efficiency
5. **Cleanup**: Remove disconnected socket listeners

## Security Considerations

### Authentication
- ✅ JWT tokens required for socket connection
- ✅ Token verification on every connection
- ✅ Automatic disconnection on invalid token

### Data Validation
- ✅ Server-side validation of all game actions
- ✅ Prevent answer injection/cheating
- ✅ XP rewards calculated server-side
- ✅ Timestamp validation to prevent manipulation

### CORS & Origins
- ✅ Whitelist allowed frontend origins
- ✅ Credentials required for socket auth
- ✅ Same-site cookie policies

### Input Sanitization
- ✅ Validate user inputs before processing
- ✅ Sanitize video uploads
- ✅ Rate limiting on socket events (recommended)

## Testing Checklist

### Unit Tests
- [ ] Socket event handlers
- [ ] Score calculation logic
- [ ] XP distribution
- [ ] Timer functionality
- [ ] Answer validation

### Integration Tests
- [ ] Socket connection flow
- [ ] Game state transitions
- [ ] Real-time leaderboard updates
- [ ] Multi-player synchronization

### E2E Tests
- [ ] Complete duel game flow
- [ ] Complete live game flow
- [ ] Video submission and voting
- [ ] Training mode completion
- [ ] Error recovery

### Manual Tests
- [ ] Play on mobile (responsive)
- [ ] Test with 10+ players (load test)
- [ ] Network disconnect and reconnect
- [ ] Browser back button handling

## Deployment Checklist

### Frontend
- [ ] Environment variables set (.env.local)
- [ ] Build optimization (npm run build)
- [ ] Service worker for offline (optional)
- [ ] CDN for static assets (optional)

### Backend
- [ ] Environment variables set (.env)
- [ ] Database migrations run
- [ ] Socket.io configured for production
- [ ] Logging enabled for monitoring
- [ ] SSL/TLS certificates (if HTTPS)

### Monitoring
- [ ] Socket connection metrics
- [ ] Error logging setup
- [ ] Performance monitoring (page load times)
- [ ] Database query logging
- [ ] User engagement tracking

---

## Troubleshooting

### Socket Connection Issues
**Problem**: "Authentication error"
**Solution**: Verify JWT token in localStorage, check backend JWT_SECRET

### Socket Timeout
**Problem**: Games disconnect after 30 seconds
**Solution**: Increase socket timeout, add heartbeat mechanism

### Leaderboard Not Updating
**Problem**: Real-time updates not showing
**Solution**: Check socket rooms/broadcasting, verify event names

### Video Upload Fails
**Problem**: Video not uploading
**Solution**: Check file size, MIME type validation, server storage

---

**Last Updated**: 2024
**Version**: 1.0.0
