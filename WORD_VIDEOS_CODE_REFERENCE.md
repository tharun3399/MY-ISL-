# Word Videos Feature - Code Reference & Examples

## API Reference

### Endpoint: GET /api/topics/words/:topicName

**URL**: `http://localhost:5000/api/topics/words/Hello%20World`

**Headers Required**:
```
Authorization: Bearer <JWT_TOKEN>
Cookie: token=<JWT_TOKEN>
```

**Example Request**:
```bash
curl -X GET \
  'http://localhost:5000/api/topics/words/Hello%20World' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Cookie: token=YOUR_JWT_TOKEN'
```

**Success Response (200)**:
```json
{
  "ok": true,
  "videos": [
    {
      "id": 1,
      "word_name": "hello",
      "video_name": "isl/hello.mp4"
    },
    {
      "id": 2,
      "word_name": "world",
      "video_name": "isl/world.mp4"
    }
  ],
  "words": ["hello", "world"],
  "totalVideos": 2,
  "topicName": "Hello World"
}
```

**Error Response (400)**:
```json
{
  "ok": false,
  "message": "Topic name cannot be empty"
}
```

**Error Response (500)**:
```json
{
  "ok": false,
  "message": "Error fetching word videos",
  "error": "database error message"
}
```

## Backend Code

### API Implementation

Location: `backend/express/expressapp/APIs/topicsfetch.js`

```javascript
// GET /topics/words/:topicName -> fetch all word videos for a topic
router.get('/words/:topicName', verifyToken, async (req, res) => {
  try {
    const { topicName } = req.params;

    if (!topicName || topicName.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Topic name cannot be empty' 
      });
    }

    // Split topic name into words
    const words = topicName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')        // Remove special characters
      .split(/\s+/)                    // Split by whitespace
      .filter(word => word.length > 0); // Remove empty strings

    if (words.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'No valid words found in topic name' 
      });
    }

    console.log('Topic name:', topicName);
    console.log('Extracted words:', words);

    // Query database for word videos
    const q = `
      SELECT 
        id,
        word_name,
        video_name
      FROM isl_words
      WHERE LOWER(word_name) = ANY($1)
      ORDER BY id ASC
    `;

    const result = await db.query(q, [words]);

    if (result.rows.length === 0) {
      return res.json({ 
        ok: true, 
        videos: [],
        words: words,
        message: 'No videos found for the words in this topic'
      });
    }

    // Format response
    const videos = result.rows.map((row) => ({
      id: row.id,
      word_name: row.word_name,
      video_name: row.video_name
    }));

    return res.json({ 
      ok: true, 
      videos,
      words: words,
      totalVideos: videos.length,
      topicName: topicName
    });
  } catch (err) {
    console.error('Word videos fetch error:', err);
    return res.status(500).json({ 
      ok: false, 
      message: 'Error fetching word videos',
      error: err.message
    });
  }
});
```

## Frontend Code

### Component State

Location: `frontend/src/components/Dashboard/LearningPath/TopicDetail.jsx`

```javascript
// Word-related state
const [wordVideos, setWordVideos] = useState([])          // Videos from isl_words table
const [currentWordVideoIndex, setCurrentWordVideoIndex] = useState(0) // Current video index
const [words, setWords] = useState([])                    // Extracted words from topic
const CLOUDFLARE_PUBLIC_URL = 'https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/'
```

### Fetch Word Videos

```javascript
// Inside useEffect that fetches topic details
// After getting topic name:

try {
  const wordVideosResponse = await axios.get(
    `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/topics/words/${encodeURIComponent(foundTopic.topic_name)}`,
    { withCredentials: true }
  )
  
  if (wordVideosResponse.data.ok && wordVideosResponse.data.videos) {
    console.log('Fetched word videos:', wordVideosResponse.data.videos)
    setWordVideos(wordVideosResponse.data.videos)
    setWords(wordVideosResponse.data.words)
    setCurrentWordVideoIndex(0)
  } else {
    console.log('No word videos found:', wordVideosResponse.data.message)
    setWordVideos([])
  }
} catch (wordErr) {
  console.warn('Error fetching word videos:', wordErr)
  setWordVideos([])
}
```

### Navigation Functions

```javascript
// Navigate to previous word video
const handlePrevWordVideo = () => {
  if (currentWordVideoIndex > 0) {
    setCurrentWordVideoIndex(currentWordVideoIndex - 1)
  }
}

// Navigate to next word video
const handleNextWordVideo = () => {
  if (currentWordVideoIndex < wordVideos.length - 1) {
    setCurrentWordVideoIndex(currentWordVideoIndex + 1)
  }
}

// Get current word video URL
const getCurrentWordVideoUrl = () => {
  if (wordVideos.length > 0 && currentWordVideoIndex < wordVideos.length) {
    const videoName = wordVideos[currentWordVideoIndex].video_name
    return `${CLOUDFLARE_PUBLIC_URL}${videoName}`
  }
  return null
}
```

### Render Word Videos Section

```jsx
{wordVideos.length > 0 && (
  <div className="word-videos-section">
    <h3 className="word-videos-title">Learn Word by Word</h3>
    <p className="word-videos-description">
      Click through each word video to master the individual signs in "{topic.topic_name}"
    </p>
    
    <div className="word-video-container">
      <button 
        className="word-video-nav-btn prev-btn" 
        onClick={handlePrevWordVideo}
        disabled={currentWordVideoIndex === 0}
        aria-label="Previous word video"
      >
        ◀ Previous
      </button>

      <div className="word-video-wrapper">
        {getCurrentWordVideoUrl() ? (
          <video 
            className="word-video-player"
            controls
            poster=""
            key={wordVideos[currentWordVideoIndex].id}
          >
            <source src={getCurrentWordVideoUrl()} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="word-video-placeholder">
            <p>Loading video...</p>
          </div>
        )}
        
        <div className="word-video-info">
          <h4 className="word-name">
            {currentWordVideoIndex + 1} of {wordVideos.length}: {wordVideos[currentWordVideoIndex]?.word_name}
          </h4>
          <p className="word-progress">
            {currentWordVideoIndex + 1} / {wordVideos.length} word videos
          </p>
        </div>
      </div>

      <button 
        className="word-video-nav-btn next-btn" 
        onClick={handleNextWordVideo}
        disabled={currentWordVideoIndex === wordVideos.length - 1}
        aria-label="Next word video"
      >
        Next ▶
      </button>
    </div>

    {/* Progress Dots */}
    <div className="word-progress-dots">
      {wordVideos.map((video, idx) => (
        <button
          key={idx}
          className={`progress-dot ${idx === currentWordVideoIndex ? 'active' : ''}`}
          onClick={() => setCurrentWordVideoIndex(idx)}
          aria-label={`Go to word ${idx + 1}: ${video.word_name}`}
          title={video.word_name}
        />
      ))}
    </div>
  </div>
)}
```

## Database Setup

### Create isl_words Table

```sql
CREATE TABLE isl_words (
  id SERIAL PRIMARY KEY,
  word_name VARCHAR(255) NOT NULL,
  video_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Add Index for Better Performance

```sql
CREATE INDEX idx_isl_words_word_name ON isl_words (LOWER(word_name));
```

### Sample Data

```sql
INSERT INTO isl_words (word_name, video_name) VALUES
('hello', 'isl/hello.mp4'),
('world', 'isl/world.mp4'),
('thank', 'isl/thank.mp4'),
('you', 'isl/you.mp4'),
('please', 'isl/please.mp4'),
('how', 'isl/how.mp4'),
('are', 'isl/are.mp4'),
('yes', 'isl/yes.mp4'),
('no', 'isl/no.mp4'),
('good', 'isl/good.mp4');
```

### Verify Data

```sql
-- Count total words
SELECT COUNT(*) as total_words FROM isl_words;

-- Find specific word
SELECT * FROM isl_words WHERE LOWER(word_name) = 'hello';

-- Find words in a phrase
SELECT * FROM isl_words 
WHERE LOWER(word_name) = ANY(ARRAY['hello', 'world']);
```

## Styling Examples

### Custom Colors

In `TopicDetail.css`:

```css
/* Change navigation button color */
.word-video-nav-btn {
  background-color: #667eea;  /* Change this */
}

/* Change progress dot color */
.progress-dot.active {
  background-color: #667eea;  /* Change this */
}

/* Change section background */
.word-videos-section {
  background-color: #ffffff;  /* Change this */
}
```

### Custom Video Player Size

```css
.word-video-player {
  min-height: 300px;  /* Increase for larger player */
  aspect-ratio: 16 / 9;
}
```

### Custom Progress Dot Size

```css
.progress-dot {
  width: 2rem;   /* Larger dots */
  height: 2rem;
}
```

## Testing Examples

### Test API Endpoint

```javascript
// Test in browser console
fetch('/api/topics/words/hello%20world', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(d => console.log(d))
```

### Test Database Query

```javascript
// Test the word splitting logic
const topicName = "Hello World";
const words = topicName
  .toLowerCase()
  .replace(/[^\w\s]/g, '')
  .split(/\s+/)
  .filter(word => word.length > 0);

console.log(words); // ["hello", "world"]
```

### Test Navigation

```javascript
// Simulate clicking next button
setCurrentWordVideoIndex(currentWordVideoIndex + 1);

// Check if disabled
const isNextDisabled = currentWordVideoIndex === wordVideos.length - 1;
console.log('Next button disabled:', isNextDisabled);
```

## Debug Logging

Add these to your code for debugging:

```javascript
// Log state changes
console.log('WordVideos state:', wordVideos);
console.log('Current index:', currentWordVideoIndex);
console.log('Total videos:', wordVideos.length);

// Log API response
console.log('API Response:', wordVideosResponse.data);

// Log extracted words
console.log('Extracted words:', words);

// Log current video URL
console.log('Current video URL:', getCurrentWordVideoUrl());
```

## Error Handling Examples

### Handle Missing Words

```javascript
if (wordVideos.length === 0) {
  console.log('No word videos found for this topic');
  // Optionally show message to user
  setWordVideos([]);
}
```

### Handle API Errors

```javascript
try {
  const response = await axios.get(
    `/api/topics/words/${encodeURIComponent(topicName)}`,
    { withCredentials: true }
  );
  // Handle success
} catch (error) {
  console.error('Failed to fetch word videos:', error);
  setWordVideos([]);
  // Show error message to user
}
```

### Handle Missing Videos

```javascript
if (!getCurrentWordVideoUrl()) {
  console.warn(`Video not found for word: ${wordVideos[currentWordVideoIndex]?.word_name}`);
  // Show placeholder
}
```

## Performance Optimization Tips

### 1. Lazy Load Videos
```javascript
// Only load video source when needed
<source src={getCurrentWordVideoUrl()} type="video/mp4" />
```

### 2. Optimize Database Query
```sql
-- Add index for faster lookups
CREATE INDEX idx_isl_words_lower_name 
ON isl_words (LOWER(word_name));
```

### 3. Cache Results
```javascript
// Could be implemented:
const [videoCache, setVideoCache] = useState({});
// Store fetched videos to avoid repeated API calls
```

### 4. Preload Next Video
```javascript
// Could preload next video while current plays
const nextVideoUrl = currentWordVideoIndex < wordVideos.length - 1 
  ? `${CLOUDFLARE_PUBLIC_URL}${wordVideos[currentWordVideoIndex + 1].video_name}`
  : null;
```

## Integration with Existing Features

### Mark Topic Complete (Already Implemented)
```javascript
const handleMarkComplete = async () => {
  // This already works with word videos feature
  // Users can still mark topic complete
}
```

### User Progress Tracking (Already Integrated)
```javascript
// Progress is tracked per topic, not per word
// Word videos are bonus learning material
```

---

**Reference Version**: 1.0
**Last Updated**: January 1, 2026
