# GameField User Navigation & Workflow Guide

## 🗺️ Navigation Map

```
Login/Register
      ↓
Dashboard (Home)
      ↓
┌─────────────────────────────────────┐
│         Sidebar Menu                │
├─────────────────────────────────────┤
│ 📊 Dashboard                        │
│ 🎓 Learning Path                    │
│ 📹 Practice Mode                    │
│ 🤖 AI Tutor                         │
│ 👥 Communities                      │
│ 🎮 GameField ← ⭐ NEW               │
└─────────────────────────────────────┘
      ↓
   GameField Hub
      ↓
┌─────────────────────────────────────┐
│    Choose Your Game Mode            │
├─────────────────────────────────────┤
│  ⚔️ Duel      🎯 Battles            │
│  🏆 Live      📚 Training           │
└─────────────────────────────────────┘
      ↓
   Play Game
      ↓
    Results
      ↓
  Earn XP 🎁
      ↓
   Play Again / Return to Hub
```

## 🎮 Game Flow Diagrams

### ⚔️ Duel (1v1) Flow
```
┌──────────────┐
│ Join Lobby   │
└──────┬───────┘
       ↓
┌──────────────────┐
│ Wait for Opponent│ ← Matchmaking
└──────┬───────────┘
       ↓
┌──────────────────┐
│  Play 5 Questions│ ✓ Timer (10s each)
│  Answer & Score  │ ✓ Real-time points
└──────┬───────────┘
       ↓
┌──────────────────┐
│  View Results    │ ✓ Winner announced
│  Earn XP         │ ✓ Score comparison
└──────┬───────────┘
       ↓
    [Play Again]
       or
    [Return Hub]
```

### 🏆 Live Games (Group) Flow
```
┌──────────────┐
│ Join Lobby   │ ← Wait for others
└──────┬───────┘
       ↓
┌──────────────────────────┐
│  Leaderboard Updates     │ ✓ See all players
│  as Players Join         │ ✓ Real-time ranking
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│  Play Questions          │ ✓ Timer (varies)
│  See Live Leaderboard    │ ✓ Live rank display
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│  View Final Rankings     │ ✓ Medals for top 3
│  Earn XP (Based on Rank) │ ✓ 1st=100, 2nd=60...
└──────┬───────────────────┘
       ↓
    [Play Again] or [Return]
```

### 🎯 Battles (Video) Flow
```
┌──────────────┐
│ Join Battle  │
└──────┬───────┘
       ↓
┌──────────────────────────┐
│  Upload Your Video       │ ✓ 📹 Click to select
│  Show Your ISL Skills    │ ✓ Preview before submit
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│  Voting Phase            │ ✓ Watch others' videos
│  Vote for Best Videos    │ ✓ Click 👍 to vote
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│  View Winner             │ ✓ 🥇 Medal display
│  See Votes & Rankings    │ ✓ 🥈 🥉 Runners up
└──────┬───────────────────┘
       ↓
    [Play Again] or [Return]
```

### 📚 Training (Solo) Flow
```
┌────────────────────────┐
│ Select Difficulty      │ 🌱 🌿 🏆
│ Beginner/Inter/Adv     │
└────────┬───────────────┘
         ↓
┌────────────────────────┐
│  Practice Questions    │ ✓ 10 questions
│  (Difficulty-based)    │ ✓ 15s timer each
└────────┬───────────────┘
         ↓
┌────────────────────────┐
│  View Results          │ ✓ Score display
│  Performance Feedback  │ ✓ Accuracy %
│  Earn XP               │ ✓ XP calculation
└────────┬───────────────┘
         ↓
    [Train Again] or [Return]
```

## 🎨 User Interface Layout

### GameField Hub (Main Page)
```
┌───────────────────────────────────────────────┐
│ 🎮 GameField                      ← Back      │
│ Challenge yourself and compete!               │
├───────────────────────────────────────────────┤
│                                               │
│  Your Stats:                                  │
│  🎯 Level 5    ⭐ Top 10%    🏅 12 Achvmts   │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│  ┌──────────────┬──────────────┐             │
│  │ ⚔️ Duel      │ 🎯 Battles   │             │
│  │ 1v1 Battle   │ Video Voting │             │
│  │ [Play Now]   │ [Play Now]   │             │
│  ├──────────────┼──────────────┤             │
│  │ 🏆 Live      │ 📚 Training  │             │
│  │ Group Quiz   │ Solo Practice│             │
│  │ [Play Now]   │ [Play Now]   │             │
│  └──────────────┴──────────────┘             │
│                                               │
├───────────────────────────────────────────────┤
│  Games Played: 24  Wins: 18  Best Score: 520 │
└───────────────────────────────────────────────┘
```

### Duel Game Screen (Playing)
```
┌───────────────────────────────────────────────┐
│ Question 3 of 5        Progress: ▓▓▓░░░░░░░  │
├───────────────────────────────────────────────┤
│                                               │
│            Score: 450  Opponent: 380          │
│                                               │
│          ⏱️ 7 seconds remaining              │
│                                               │
│  "How do you sign 'hello' in ISL?"            │
│                                               │
│  A) Point to ears       B) Wave hand          │
│  C) Touch forehead      D) Shake hands        │
│                                               │
│  [Cancel Game]      [Submit Answer]           │
│                                               │
└───────────────────────────────────────────────┘
```

### Live Games Leaderboard (Showing Live)
```
┌───────────────────────────────────────────────┐
│ 🏆 Live Leaderboard                           │
├───────────────────────────────────────────────┤
│ Rank │ Player      │ Score  │ Bonus │ Total │
├──────┼─────────────┼────────┼───────┼───────┤
│  🥇  │ Sarah (You) │ 340    │  +20  │ 360   │
│  🥈  │ Ahmed       │ 320    │  +15  │ 335   │
│  🥉  │ Mira        │ 280    │  +10  │ 290   │
│   4  │ Dev         │ 250    │   +5  │ 255   │
│   5  │ Priya       │ 240    │   +3  │ 243   │
│                                               │
│  Current Question: 4/10                      │
│  Time Left: 00:08                            │
│                                               │
└───────────────────────────────────────────────┘
```

### Training Mode - Difficulty Selection
```
┌───────────────────────────────────────────────┐
│ 📚 Training Mode                              │
│ Practice and improve your ISL skills!         │
├───────────────────────────────────────────────┤
│                                               │
│  Select Difficulty:                          │
│                                               │
│  ┌─────────┬─────────────┬──────────┐        │
│  │   🌱    │    🌿       │   🏆    │        │
│  │Beginner │Intermediate │ Advanced│        │
│  └─────────┴─────────────┴──────────┘        │
│                                               │
│  Info Grid:                                  │
│  Questions: 10      Time per Q: 15 sec       │
│  Scoring: Time-based  Mode: Solo Practice    │
│                                               │
│         [Start Training]                     │
│                                               │
└───────────────────────────────────────────────┘
```

### Results Screen - Victory
```
┌───────────────────────────────────────────────┐
│             🎉 Duel Complete!                 │
├───────────────────────────────────────────────┤
│                                               │
│              🥇 You Won! 🥇                  │
│                                               │
│         Your Score:  520                     │
│         Opponent:    480                     │
│                                               │
│  ┌──────────┬──────────┬──────────┐          │
│  │  Correct │  Accuracy│   XP    │          │
│  │    4/5   │   80%    │  +150   │          │
│  └──────────┴──────────┴──────────┘          │
│                                               │
│     [Play Again]        [Return to Hub]      │
│                                               │
└───────────────────────────────────────────────┘
```

## 📊 Game Statistics Display

### Stats Cards (Hub Page)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    🎮       │  │    🏆       │  │    💪       │
│Games Played │  │  Wins/Losses│  │   Level    │
│     24      │  │    18/6     │  │      5     │
└─────────────┘  └─────────────┘  └─────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    💎       │  │    ⭐       │  │   📈       │
│Total Points │  │   Rank     │  │Best Score │
│    8,450    │  │  Top 10%   │  │    520    │
└─────────────┘  └─────────────┘  └─────────────┘
```

## 🎮 Controls & Interactions

### Mouse/Trackpad Controls
```
Action                    How to Do It
─────────────────────────────────────────
Select Game              Click on game card
Submit Answer            Click answer button
Vote on Video            Click 👍 button
Upload Video             Click upload area
Change Video             Click "Change Video" button
Return to Hub            Click "Back to Hub" button
Select Difficulty        Click difficulty button
Adjust Timer             N/A (auto countdown)
Play Again               Click "Play Again" button
```

### Touch Controls (Mobile)
```
Action                    How to Do It
─────────────────────────────────────────
Select Game              Tap game card
Submit Answer            Tap answer button
Vote on Video            Tap 👍 button
Upload Video             Tap upload area → select from camera roll
Change Video             Tap "Change Video" button
Navigate Back            Tap back arrow or "Back to Hub"
Select Difficulty        Tap difficulty button
```

## 📱 Responsive Behavior

### Desktop (1024px+)
- Full-width layout
- 2x2 game card grid
- Side-by-side opponent/leaderboard
- Expanded stat cards

### Tablet (768px+)
- Adjusted padding
- 2-column game grid
- Stacked leaderboard
- Compact stat cards

### Mobile (480px+)
- Full-width cards
- 1-column game grid
- Vertical leaderboard
- Stacked stats
- Larger touch targets

## 🎯 Quick Tips for Players

### ⚔️ Duel Tips
- Answer quickly for time bonus
- 10 seconds per question
- Beat your opponent to win
- Each correct answer = 10-100 points

### 🏆 Live Games Tips
- Speed matters for bonus points
- See your rank in real-time
- Top 3 earn XP
- Play against 3-8 players

### 🎯 Battles Tips
- Show your best ISL skills
- Watch others' videos
- Vote for your favorite
- Win by getting most votes

### 📚 Training Tips
- Start with Beginner mode
- Progress to Advanced
- Practice difficult topics
- Improve accuracy and speed

## 🏅 Achievement Levels

Based on Score:
```
Score Range    Level        Badge
─────────────────────────────────
0-100          Novice       🌱
101-250        Learner      📖
251-400        Practitioner 💪
401-600        Expert       ⭐
601+           Master       🏆
```

## 🔔 Notifications & Alerts

### In-Game Alerts
```
✓ Correct Answer     → Green highlight + ✓
✗ Wrong Answer       → Red highlight + ✗
⏱️ Time Running Out  → Yellow timer + alert
🎯 You Won!          → Victory message + XP
🥈 You Placed 2nd!   → Medal + XP amount
```

### Status Messages
```
⏳ Finding Opponent...
🎮 Game Starting...
📊 Loading Leaderboard...
✅ Answer Submitted
❌ Connection Lost - Reconnecting...
🎉 Earned 150 XP!
```

## 🆘 Help & Troubleshooting

### Quick Help
- **How do I join a game?** → Click "Play Now" on game card
- **How do I earn XP?** → Win games and complete challenges
- **How do I improve?** → Practice in Training Mode
- **Where are my stats?** → Check GameField hub

### Game Not Loading?
1. Refresh the page
2. Check internet connection
3. Close and reopen app
4. Clear browser cache

### Opponent Disconnected?
- Game may continue or end
- Check results screen
- XP may still be awarded

---

**Ready to Play? Click "GameField" in your sidebar to start! 🎮**
