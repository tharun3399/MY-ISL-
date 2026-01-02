# Sockets Folder — Real-Time Multiplayer Features

This folder contains **WebSocket handlers** for multiplayer game features using Socket.io. Each file handles a different game mode with real-time communication between players and the server.

---

## 📋 File Overview

### **1. battles.js** — Battle/Submission System
Handles one-to-many player battles where users submit video clips and vote on submissions.

**Key Features:**
- Players join a battle room by `roomId`
- Players submit video clips (`clipKey`) for others to judge
- Other players vote on submissions in real-time
- In-memory room state with players list and submissions
- Auto-cleanup on disconnect

**Events:**
- `battles:join` — Player joins a battle room
- `battles:submit` — Player submits a clip (stores with timestamp)
- `battles:vote` — Player votes on a submission
- `battles:user-joined` — Broadcast to room
- `battles:submission` — Broadcast new submission to room
- `battles:vote` — Broadcast vote to room
- `battles:user-left` — Broadcast when player disconnects

**Flow:** Join Room → Submit Clip → Vote → Results

---

### **2. duel.js** — 1v1 Quiz Match (Server-Driven)
Server-authoritative quiz battle between two players with timed questions.

**Key Features:**
- **5 questions per match** (can be replaced with DB queries)
- **Server-controlled timing**: 10 seconds per question, 2.5s reveal delay
- Multiple-choice answers with correct answer validation
- **Scoring**: +1 point per correct answer
- **Queue integration**: Players can subscribe via REST API matchmaker
- **Forfeit support**: Players can abandon match
- **Winner determination**: Highest score wins (tie detection included)

**Configuration:**
```javascript
const QUESTION_TIME = 10;      // seconds per question
const REVEAL_MS = 2500;        // ms to show reveal before next question
const TOTAL_QUESTIONS = 5;     // questions per match
```

**Events:**
- `queue:subscribe` — Player enters queue (matched by settings)
- `queue:unsubscribe` — Player leaves queue
- `duel:match-start` — Both players get opponent info
- `duel:question` — Server sends question with options and deadline
- `duel:answer` — Player submits their choice
- `duel:reveal` — Show correct answer, scores, and explanations
- `duel:forfeit` — Player concedes
- `duel:match-end` — Final scores and winner declared

**State Structure:**
```javascript
matches[matchId] = {
  players: [{ userId, name, socketId }, ...],
  scores: { userId: points, ... },
  currentQ: 0,
  answered: { userId: chosenIndex, ... },
  status: 'waiting' | 'running' | 'ended'
}
```

**Flow:** Subscribe to Queue → Wait for Match → Opponent Found → Answer 5 Questions (Timed) → See Scores → Winner Announced

---

### **3. games.js** — Live Group Quiz (Multiple Players)
Broadcast-based quiz where many players compete simultaneously in the same game.

**Key Features:**
- Multiple players in one `gameKey` room
- **Admin/host broadcasts questions** from database
- **Real-time scoring** with speed bonus (faster answers = more points)
- **Leaderboard updates** after each question
- **Elimination system**: Players who skip 1 question get eliminated
- **XP rewards**: Top 3 get 100/60/30 XP respectively
- Scores persisted to `live_game_results` database table

**Scoring Algorithm:**
```javascript
base = 10 points
speedBonus = Math.floor(Math.max(0, 5000 - responseTimeMs) / 500)
totalGained = base + speedBonus  // if correct answer
```

**Events:**
- `games:join` — Player enters live game room
- `games:joined` — Ack player join
- `games:user-joined` — Broadcast to all in room
- `games:start` — Admin triggers game start
- `games:started` — Server broadcasts game config
- `games:question` — Broadcast question (no answer included)
- `games:answer` — Player submits answer with timestamp
- `games:answer-received` — Ack with points gained
- `games:leaderboard` — Updated standings (top 50)
- `games:round-summary` — Question stats + eliminated players
- `games:finished` — Final leaderboard + XP awarded

**Database Tables Used:**
- `live_games` — Game config (total_questions, question_time_seconds)
- `live_game_questions` — Question pool (statement, options, answer_index)
- `live_game_players` — Live scores during game
- `live_game_results` — Final rankings + XP awarded

**Flow:** 
1. Players join game
2. Admin starts game
3. Server broadcasts questions one-by-one
4. Players answer within time limit
5. Leaderboard updates + elimination tracked
6. After all questions: XP awarded to top 3

---

### **4. matchmaker.js** — Queue Management & Pairing
Matches players into games based on game settings (mode, duration).

**Key Features:**
- **Settings-based grouping**: Players grouped by `{ mode, duration }`
- **FIFO matching**: First 2 players with same settings auto-matched
- **Safe emit**: Checks socket connection before sending
- Queue persistence and cleanup on disconnect

**Settings Keys:**
```javascript
{ mode: 'competitive' | 'casual', duration: 1 | 5 }  // minutes
```

**Events:**
- `queue:subscribe` — Player enters waiting queue
- `queue:unsubscribe` — Player exits queue
- `matched` — Both players get matchId + opponent info + settings
- `error` — Invalid payload (missing queueId)

**State Structure:**
```javascript
waiting = {
  '{"mode":"competitive","duration":1}': [
    { socketId, queueId, userId, username },
    ...
  ]
}
```

**Internal Methods (exposed for testing):**
- `subscribeSocket()` — Add player to queue & check for match
- `unsubscribeQueue()` — Remove queue
- `removeSocketSubscriptions()` — Cleanup on disconnect

**Flow:** 
1. Player calls `queue:subscribe` with queueId + settings
2. If queue exists with same settings → match found → both get `matched` event
3. Else → added to waiting queue
4. On disconnect → auto-cleanup

---

## 🔧 Integration Notes

### How Matchmaker feeds into Duel
1. **REST API** calls matchmaker's `subscribeSocket()` when player joins duel queue
2. When 2 players match, both get `matched` event with `matchId` + opponent data
3. Players connect to `/duel` WebSocket room and start match in `duel.js`

### Database Integration
- **Games.js** queries `live_games` and `live_game_questions` from database
- Persists scores to `live_game_players` and final results to `live_game_results`
- **Duel.js** currently uses hard-coded questions (should be updated to fetch from DB)

### Socket.io Room Names
- **Battles**: `roomId` (passed by client)
- **Duel**: `matchId` (UUID generated by matchmaker)
- **Games**: `game:${gameKey}` (e.g., `game:abc123`)
- **Matchmaker**: `queueId` (passed by client)

---

## 🚀 Quick Start

All socket handlers are initialized in `server.js`:
```javascript
const initBattles = require('./sockets/battles');
const initDuel = require('./sockets/duel');
const initGames = require('./sockets/games');
const attachMatchmaker = require('./sockets/matchmaker');

const io = require('socket.io')(server, { cors: { origin: '*' } });

initBattles(io);
initDuel(io);
initGames(io);
attachMatchmaker(io);
```

Client connects and subscribes to events:
```javascript
socket.emit('games:join', { gameKey: 'abc123', user: { id: 1, name: 'Alice' } });
socket.on('games:question', (q) => { /* render question */ });
socket.emit('games:answer', { gameKey, user, questionIdx: 0, selectedIndex: 2 });
```

---

## 📊 Summary Table

| Feature | Players | Timing | Scoring | Persistence |
|---------|---------|--------|---------|-------------|
| **Battles** | 2+ | None | Manual voting | No |
| **Duel** | 2 | Server-timed (10s/q) | Auto +1 correct | Optional |
| **Games** | Many | Server-timed + speed | Auto + bonus | Yes (XP) |
| **Matchmaker** | N/A | Instant | N/A | Queue only |

