# Word Videos Implementation Guide

## Overview
This feature enables users to learn individual signs by breaking down topic names into words and fetching corresponding videos from the `isl_words` database table.

## Architecture

### 1. Backend Implementation

#### New API Endpoint: `/api/topics/words/:topicName`

**Location**: [backend/express/expressapp/APIs/topicsfetch.js](backend/express/expressapp/APIs/topicsfetch.js)

**Functionality**:
- Accepts a topic name as a URL parameter
- Splits the topic name into individual words
- Removes special characters and converts to lowercase
- Searches the `isl_words` table for matching words
- Returns all video files associated with the words

**Request**:
```
GET /api/topics/words/Hello%20World
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```json
{
  "ok": true,
  "videos": [
    {
      "id": 1,
      "word_name": "hello",
      "video_name": "hello.mp4"
    },
    {
      "id": 2,
      "word_name": "world",
      "video_name": "world.mp4"
    }
  ],
  "words": ["hello", "world"],
  "totalVideos": 2,
  "topicName": "Hello World"
}
```

**Database Query**:
```sql
SELECT id, word_name, video_name
FROM isl_words
WHERE LOWER(word_name) = ANY($1)
ORDER BY id ASC
```

### 2. Frontend Implementation

#### Component: TopicDetail.jsx

**Location**: [frontend/src/components/Dashboard/LearningPath/TopicDetail.jsx](frontend/src/components/Dashboard/LearningPath/TopicDetail.jsx)

**New State Variables**:
- `wordVideos`: Array of videos from `isl_words` table
- `currentWordVideoIndex`: Current video being displayed
- `words`: Extracted words from topic name

**New Functions**:
- `handlePrevWordVideo()`: Navigate to previous word video
- `handleNextWordVideo()`: Navigate to next word video
- `getCurrentWordVideoUrl()`: Get the current video URL from Cloudflare

**Data Flow**:
1. Component mounts and fetches topic details
2. After getting topic name, calls `/api/topics/words/:topicName` endpoint
3. Receives array of word videos
4. Displays videos in a carousel-style player
5. User can navigate between word videos using buttons or progress dots

#### Styling: TopicDetail.css

**Location**: [frontend/src/components/Dashboard/LearningPath/TopicDetail.css](frontend/src/components/Dashboard/LearningPath/TopicDetail.css)

**New Classes**:
- `.word-videos-section`: Container for word videos section
- `.word-video-container`: Flex container for navigation buttons and video player
- `.word-video-wrapper`: Video player wrapper
- `.word-video-player`: Video element styling
- `.word-video-nav-btn`: Navigation buttons (Previous/Next)
- `.word-progress-dots`: Progress indicator dots
- `.progress-dot`: Individual progress dot
- `.word-name`: Word label display
- `.word-progress`: Progress text display

## Feature Details

### Video Playback
- Videos are fetched from Cloudflare using the existing URL format
- Each word has its own video file stored in the `isl_words` table
- Videos support HTML5 video controls (play, pause, volume, fullscreen)

### Navigation
- **Previous Button**: Navigates to the previous word video (disabled on first video)
- **Next Button**: Navigates to the next word video (disabled on last video)
- **Progress Dots**: Click any dot to jump directly to that word's video

### Responsive Design
- On desktop: Videos display at full width with navigation buttons on sides
- On mobile: Navigation buttons stack vertically, video height optimized
- Progress dots are responsive and adjust sizing on smaller screens

## User Workflow

1. **User clicks on a topic** (e.g., "Hello World")
   - TopicDetail page loads
   
2. **Topic video is displayed**
   - Main topic video plays at the top
   
3. **Word videos section appears**
   - If words are found in the `isl_words` table
   - Shows "Learn Word by Word" section
   
4. **User navigates through word videos**
   - Clicks Previous/Next buttons or progress dots
   - Each word video plays with controls
   - Progress indicator shows current position
   
5. **User completes learning**
   - Marks topic as complete
   - Progress is saved to database

## Database Requirements

### isl_words Table Structure
```sql
CREATE TABLE isl_words (
  id SERIAL PRIMARY KEY,
  word_name VARCHAR(255) NOT NULL,
  video_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id`: Unique identifier
- `word_name`: The sign word (lowercase)
- `video_name`: Video file name on Cloudflare (e.g., "hello.mp4")
- `created_at`: Timestamp when record was created

## Implementation Checklist

- [x] Create API endpoint to fetch word videos
- [x] Add word video fetching logic to TopicDetail component
- [x] Create video player component for word videos
- [x] Add navigation controls (Previous/Next buttons)
- [x] Add progress indicators (dots)
- [x] Style word videos section
- [x] Add responsive design for mobile
- [x] Add error handling for missing videos
- [ ] Test with actual database data
- [ ] Upload videos to Cloudflare
- [ ] Test video playback quality
- [ ] Monitor performance with multiple videos

## Example Implementation

### Adding Test Data to Database

```sql
INSERT INTO isl_words (word_name, video_name) VALUES
('hello', 'isl_hello.mp4'),
('world', 'isl_world.mp4'),
('thanks', 'isl_thanks.mp4'),
('please', 'isl_please.mp4');
```

### Testing the Feature

1. Navigate to a topic with words that exist in `isl_words` table
2. The "Learn Word by Word" section should appear
3. Click through videos using Previous/Next buttons
4. Click progress dots to jump between videos
5. Verify videos play correctly from Cloudflare

## Troubleshooting

### Videos Not Appearing
- Check browser console for API errors
- Verify `/api/topics/words/:topicName` endpoint returns data
- Ensure topic name contains words in `isl_words` table

### Videos Won't Play
- Check Cloudflare URL format
- Verify video files exist on Cloudflare
- Check browser network tab for 404 errors

### Progress Not Saving
- Verify JWT token is valid
- Check database connection
- Review browser console for auth errors

## Performance Optimization

- Videos are lazy-loaded as user navigates
- Progress is saved asynchronously (doesn't block UI)
- Cloudflare CDN ensures fast video delivery
- Responsive images prevent unnecessary data transfer on mobile

## Future Enhancements

1. **Video Prefetching**: Load next video while current plays
2. **Auto-play**: Automatically play next video when current ends
3. **Bookmarking**: Save favorite word videos
4. **Progress Tracking**: Track which words user has watched
5. **Quiz Integration**: Add quizzes after word videos
6. **Multiple Languages**: Support word search in different ISL dialects
7. **Offline Mode**: Cache videos for offline learning

## API Documentation

### Endpoint: GET /api/topics/words/:topicName

**Authentication**: Required (JWT Token)

**Parameters**:
- `topicName` (string, URL encoded): The topic name to split and search

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Cookie: token=<JWT_TOKEN>
```

**Success Response (200)**:
```json
{
  "ok": true,
  "videos": [
    {
      "id": number,
      "word_name": string,
      "video_name": string
    }
  ],
  "words": [string],
  "totalVideos": number,
  "topicName": string
}
```

**Error Response (400/500)**:
```json
{
  "ok": false,
  "message": string,
  "error": string
}
```

## Code References

### Backend Routes
- GET `/api/topics/lesson/:lessonId` - Get topics for a lesson
- GET `/api/topics/words/:topicName` - Get word videos for a topic (NEW)
- POST `/api/topics/progress` - Update topic completion status

### Frontend Components
- [TopicDetail.jsx](frontend/src/components/Dashboard/LearningPath/TopicDetail.jsx) - Main component
- [TopicDetail.css](frontend/src/components/Dashboard/LearningPath/TopicDetail.css) - Styles

### Database Tables
- `topics` - Lesson topics
- `isl_words` - Individual sign words with videos (required for this feature)
- `user_topic_progress` - User's topic completion status
