# Word Videos Feature - Visual Architecture & Flow Diagrams

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE (Frontend)                         │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Dashboard / Learning Path                      │   │
│  │                                                                   │   │
│  │  Click Topic: "Hello World"                                     │   │
│  │       ↓                                                           │   │
│  │  Load TopicDetail Component                                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              Display Topic Details Page                           │   │
│  │  ┌────────────────────────────────────────┐                      │   │
│  │  │   Main Topic Video                     │                      │   │
│  │  │   (Topic Name: "Hello World")          │                      │   │
│  │  │   ▶ Play video from Cloudflare        │                      │   │
│  │  └────────────────────────────────────────┘                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │          Call API: /api/topics/words/Hello%20World              │   │
│  │          (with JWT authentication)                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js / Express)                        │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              API Endpoint: GET /topics/words/:topicName          │   │
│  │                                                                   │   │
│  │  Step 1: Parse Topic Name                                       │   │
│  │          Input: "Hello World"                                   │   │
│  │          ↓                                                       │   │
│  │  Step 2: Split into Words                                       │   │
│  │          • Convert to lowercase: "hello world"                  │   │
│  │          • Remove special chars: "hello world"                  │   │
│  │          • Split by spaces: ["hello", "world"]                 │   │
│  │          ↓                                                       │   │
│  │  Step 3: Build Database Query                                   │   │
│  │          SELECT id, word_name, video_name                      │   │
│  │          FROM isl_words                                        │   │
│  │          WHERE LOWER(word_name) = ANY(['hello','world'])       │   │
│  │          ↓                                                       │   │
│  │  Step 4: Execute Query                                          │   │
│  │          ↓                                                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                              │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     isl_words Table                              │   │
│  │                                                                   │   │
│  │  ┌────┬────────────┬─────────────────┐                           │   │
│  │  │ id │ word_name  │ video_name      │                           │   │
│  │  ├────┼────────────┼─────────────────┤                           │   │
│  │  │ 1  │ hello      │ isl/hello.mp4   │ ← MATCH                  │   │
│  │  │ 2  │ world      │ isl/world.mp4   │ ← MATCH                  │   │
│  │  │ 3  │ thank      │ isl/thank.mp4   │                           │   │
│  │  │ 4  │ you        │ isl/you.mp4     │                           │   │
│  │  └────┴────────────┴─────────────────┘                           │   │
│  │                                                                   │   │
│  │  Query Result:                                                   │   │
│  │  [                                                               │   │
│  │    {id: 1, word_name: "hello", video_name: "isl/hello.mp4"},  │   │
│  │    {id: 2, word_name: "world", video_name: "isl/world.mp4"}   │   │
│  │  ]                                                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND RESPONSE                                   │
│                                                                           │
│  HTTP 200 OK                                                             │
│  {                                                                        │
│    "ok": true,                                                           │
│    "videos": [                                                           │
│      {                                                                    │
│        "id": 1,                                                          │
│        "word_name": "hello",                                             │
│        "video_name": "isl/hello.mp4"                                     │
│      },                                                                   │
│      {                                                                    │
│        "id": 2,                                                          │
│        "word_name": "world",                                             │
│        "video_name": "isl/world.mp4"                                     │
│      }                                                                    │
│    ],                                                                     │
│    "words": ["hello", "world"],                                          │
│    "totalVideos": 2,                                                     │
│    "topicName": "Hello World"                                            │
│  }                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND PROCESSES RESPONSE                           │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  1. Store in State                                              │   │
│  │     setWordVideos([                                             │   │
│  │       {id:1, word_name:"hello", video_name:"isl/hello.mp4"},  │   │
│  │       {id:2, word_name:"world", video_name:"isl/world.mp4"}   │   │
│  │     ])                                                          │   │
│  │     setWords(["hello", "world"])                               │   │
│  │     setCurrentWordVideoIndex(0)  // Start at first video       │   │
│  │                                                                   │   │
│  │  2. Render Word Videos Section                                  │   │
│  │     Check: wordVideos.length > 0 → true                        │   │
│  │     → Display "Learn Word by Word" section                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   UI: LEARN WORD BY WORD SECTION                        │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Learn Word by Word                                             │   │
│  │  Click through each word video to master the individual signs   │   │
│  │                                                                   │   │
│  │  ┌───────────┬──────────────────────────┬───────────┐           │   │
│  │  │ ◀ PREV    │                          │ NEXT ▶    │           │   │
│  │  │ (Disabled)│   Video Player           │ (Enabled) │           │   │
│  │  │           │   [Playing hello.mp4]    │           │           │   │
│  │  │           │   ▶ Play │⏸ Pause │ 🔊   │           │           │   │
│  │  ├───────────┴──────────────────────────┴───────────┤           │   │
│  │  │ 1 of 2: hello                                    │           │   │
│  │  │ 1 / 2 word videos                               │           │   │
│  │  └──────────────────────────────────────────────────┘           │   │
│  │                                                                   │   │
│  │  Progress: ● ◯  (Click to jump)                                │   │
│  │             ↑ Current word                                      │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  User Interaction:                                                       │
│  • Click "NEXT ▶" → Load video 2 ("world")                             │
│  • Click Progress Dot 2 → Jump to video 2                              │
│  • Play/Pause controls work normally                                   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE CDN SERVING VIDEOS                        │
│                                                                           │
│  URL: https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/            │
│       isl/hello.mp4                                                      │
│       isl/world.mp4                                                      │
│                                                                           │
│  └─→ Download MP4 video file                                            │
│      │                                                                    │
│      └─→ Stream to user's browser                                        │
│          │                                                                │
│          └─→ Video plays in HTML5 player                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence Diagram

```
User        Browser         Frontend       Backend        Database      Cloudflare
  │            │               │              │               │             │
  │ Click Topic │               │              │               │             │
  ├──────────→  │               │              │               │             │
  │            │ Load Component  │              │               │             │
  │            ├──────────────→  │              │               │             │
  │            │                │ API Request  │               │             │
  │            │                ├────────────→ │               │             │
  │            │                │              │ Query Topics  │             │
  │            │                │              ├──────────────→│             │
  │            │                │              │←──────────────┤ (ID, Name)  │
  │            │ Get Topic Name  │              │               │             │
  │            │←─────────────── │              │               │             │
  │            │ API Request     │              │               │             │
  │            │ /api/topics/    │              │               │             │
  │            │ words/Hello%20  │              │               │             │
  │            │ World           │              │               │             │
  │            ├──────────────────────────────→ │               │             │
  │            │                │              │ Parse Name    │             │
  │            │                │              │ Split Words   │             │
  │            │                │              │ Query isl_    │             │
  │            │                │              │ words         │             │
  │            │                │              ├──────────────→│             │
  │            │                │              │ SELECT id,    │             │
  │            │                │              │ word_name,    │             │
  │            │                │              │ video_name    │             │
  │            │                │              │ WHERE word IN │             │
  │            │                │              │ (hello,world) │             │
  │            │                │              │               │ Return 2    │
  │            │                │              │←──────────────┤ rows        │
  │            │                │ JSON Array   │               │             │
  │            │←──────────────────────────── │               │             │
  │            │ Process Data   │              │               │             │
  │            │ setState()     │              │               │             │
  │            │                │              │               │             │
  │ Display    │ Render Word    │              │               │             │
  │ Videos    │ Videos Section  │              │               │             │
  │←──────────┤                │              │               │             │
  │            │ Video Player   │              │               │             │
  │            │ Navigation     │              │               │             │
  │            │ Progress Dots  │              │               │             │
  │            │                │              │               │             │
  │ Click Next │                │              │               │             │
  ├──────────→ │ Update Index   │              │               │             │
  │            │ setCurrentIdx  │              │               │             │
  │            │ Re-render      │              │               │             │
  │            │                │              │               │             │
  │ Play Video │ Load Video URL │              │               │    Stream  │
  │←──────────┤ from Cloudflare ├────────────────────────────────────────→  │
  │            │                │              │               │    MP4     │
  │            │                │              │               │←───────────┤
  │ Watch      │ HTML5 Controls │              │               │            │
  │ Learning   │                │              │               │            │
  │            │ User Navigates │              │               │            │
  │            │ Through Videos │              │               │            │
  │            │                │              │               │            │
```

## State Management Diagram

```
TopicDetail Component State
│
├── Topic Data
│   ├── topic: {id, lesson_id, topic_name, video_name, completed}
│   ├── module: {module_name, ...}
│   └── videoUrl: "https://cloudflare...main-topic.mp4"
│
├── Word Videos Data (NEW)
│   ├── wordVideos: [
│   │   {id: 1, word_name: "hello", video_name: "isl/hello.mp4"},
│   │   {id: 2, word_name: "world", video_name: "isl/world.mp4"}
│   │]
│   ├── currentWordVideoIndex: 0 (points to first word)
│   └── words: ["hello", "world"]
│
├── UI State
│   ├── loading: boolean
│   ├── error: string | null
│   └── isCompleted: boolean
│
└── Constants
    └── CLOUDFLARE_PUBLIC_URL: "https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/"

When currentWordVideoIndex changes:
  getCurrentWordVideoUrl() → "https://cloudflare.../isl/hello.mp4"
                             "https://cloudflare.../isl/world.mp4"
                             etc.
```

## Component Render Tree

```
TopicDetail
│
├── Sidebar
│
└── topic-detail-container
    │
    ├── back-btn (Back to Module)
    │
    ├── breadcrumb (Module → Topic)
    │
    ├── topic-header
    │   ├── topic-title ("Hello World")
    │   └── topic-actions
    │       └── complete-btn (Mark as Complete)
    │
    ├── video-container (Main Topic Video)
    │   └── video-player (controls, src={videoUrl})
    │
    ├── word-videos-section (NEW - IF wordVideos.length > 0)
    │   │
    │   ├── word-videos-title ("Learn Word by Word")
    │   ├── word-videos-description
    │   │
    │   ├── word-video-container
    │   │   ├── word-video-nav-btn (Previous - disabled)
    │   │   │
    │   │   ├── word-video-wrapper
    │   │   │   ├── word-video-player (src={getCurrentWordVideoUrl()})
    │   │   │   └── word-video-info
    │   │   │       ├── word-name ("1 of 2: hello")
    │   │   │       └── word-progress ("1 / 2 word videos")
    │   │   │
    │   │   └── word-video-nav-btn (Next - enabled)
    │   │
    │   └── word-progress-dots
    │       ├── progress-dot (active) → onClick: setCurrentWordVideoIndex(0)
    │       └── progress-dot → onClick: setCurrentWordVideoIndex(1)
    │
    └── topic-content
        ├── content-section (About This Topic)
        ├── content-section (Learning Objectives)
        └── content-section (Progress)
```

## Video Navigation State Machine

```
State: currentWordVideoIndex = 0 (First Video)
  │
  ├─ Previous Button: DISABLED
  │  └─ Cannot go to index -1
  │
  ├─ Next Button: ENABLED
  │  └─ Can go to index 1
  │  └─ onClick → setCurrentWordVideoIndex(1)
  │              └─ Trigger Re-render
  │                 └─ Load new video from array[1]
  │
  ├─ Progress Dots:
  │  ├─ Dot[0]: ACTIVE (highlight)
  │  └─ Dot[1]: INACTIVE (clickable)
  │     └─ onClick → setCurrentWordVideoIndex(1)
  │
  └─ Display:
     └─ wordVideos[0]: {id: 1, word_name: "hello", video_name: "isl/hello.mp4"}
        └─ Show: "1 of 2: hello" | "1 / 2 word videos"
        └─ Load: getCurrentWordVideoUrl() → "https://cloudflare.../isl/hello.mp4"


State: currentWordVideoIndex = 1 (Last Video)
  │
  ├─ Previous Button: ENABLED
  │  └─ Can go to index 0
  │  └─ onClick → setCurrentWordVideoIndex(0)
  │
  ├─ Next Button: DISABLED
  │  └─ Cannot go to index 2 (out of bounds)
  │
  ├─ Progress Dots:
  │  ├─ Dot[0]: INACTIVE (clickable)
  │  │  └─ onClick → setCurrentWordVideoIndex(0)
  │  └─ Dot[1]: ACTIVE (highlight)
  │
  └─ Display:
     └─ wordVideos[1]: {id: 2, word_name: "world", video_name: "isl/world.mp4"}
        └─ Show: "2 of 2: world" | "2 / 2 word videos"
        └─ Load: getCurrentWordVideoUrl() → "https://cloudflare.../isl/world.mp4"
```

## API Call Timeline

```
Time  Client                Server              Database           Cloudflare
──────────────────────────────────────────────────────────────────────────
 0ms  GET /api/topics/lesson/:moduleId
      ├─────────────────────→ Process request
                             ├─────────────→ Query topics
                             ├─ Get topic ID, name, video_name
                             ←─────────────── Return rows
                             ←─ Send response
      ←─────────────────────
 
 50ms Response: Topic name = "Hello World"
      Save topic state
      
 51ms GET /api/topics/words/Hello%20World
      ├─────────────────────→ Parse topic name
                             Split: "Hello World" → ["hello", "world"]
                             ├─────────────→ Query isl_words
                             ├─ SELECT * WHERE word IN (hello, world)
                             ←─────────────── Return 2 rows
                             ├─ Format response
                             ←─ Send response
      ←─────────────────────
      
100ms Response: wordVideos array with 2 videos
      setState(wordVideos)
      Display word videos section
      
101ms User clicks "Next"
      setCurrentWordVideoIndex(1)
      Re-render with new video URL
      
102ms Load video source
                                                                    ← Stream MP4
      ├──────────────────────────────────────────────────────────→ GET /isl/world.mp4
                                                                    └─ Serve video file
      ←──────────────────────────────────────────────────────────  Stream 1,000+ MB
      
200ms Video playing in browser
      User can play/pause/seek with HTML5 controls
```

---

**Diagram Version**: 1.0
**Last Updated**: January 1, 2026
