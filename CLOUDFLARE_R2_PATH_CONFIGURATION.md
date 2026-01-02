# Cloudflare R2 Path Configuration Guide

## Your Bucket Structure

Based on your Cloudflare R2 bucket, you have videos organized in folders:

```
islvideos/ (bucket root)
├── Animated/
├── First_R2/
├── Fourth_R2/
├── Second_R2/
├── Third_R2/
└── Other folders...
```

Videos can be in:
- Root directory: `islvideos/video.mp4`
- Animated folder: `islvideos/Animated/video.mp4`
- First_R2 folder: `islvideos/First_R2/video.mp4`
- Any other folder

---

## How the System Works

### URL Construction

The frontend constructs the full Cloudflare URL like this:

```javascript
// Base URL (constant)
const CLOUDFLARE_PUBLIC_URL = 'https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/'

// Video path from database
const videoName = 'Animated/hello.mp4'

// Full URL
const fullUrl = `${CLOUDFLARE_PUBLIC_URL}${videoName}`
// Result: https://pub-xxx.r2.dev/Animated/hello.mp4
```

**The key is: Your `video_name` in the database must include the folder path!**

---

## Database Configuration

### For Topics Table

When storing main topic videos, include the folder path:

```sql
-- Example topic with video in Animated folder
INSERT INTO topics (lesson_id, topic_name, video_name) VALUES
(1, 'Hello World', 'Animated/hello_world.mp4');

-- Example topic with video in root
INSERT INTO topics (lesson_id, topic_name, video_name) VALUES
(1, 'Basic Signs', 'basic_signs.mp4');

-- Example topic with video in First_R2 folder
INSERT INTO topics (lesson_id, topic_name, video_name) VALUES
(1, 'Advanced Signs', 'First_R2/advanced_signs.mp4');
```

### For isl_words Table (Word Videos)

When storing individual word videos, include the folder path:

```sql
-- Words in different folders
INSERT INTO isl_words (word_name, video_name) VALUES
('hello', 'Animated/hello.mp4'),       -- In Animated folder
('world', 'world.mp4'),                -- In root
('thank', 'First_R2/thank.mp4'),       -- In First_R2 folder
('you', 'Second_R2/you.mp4'),          -- In Second_R2 folder
('please', 'please.mp4'),              -- In root
('amazing', 'Third_R2/amazing.mp4');   -- In Third_R2 folder
```

---

## URL Examples

### Example 1: Video in Root Directory

**Database**:
```
video_name = 'hello.mp4'
```

**URL Construction**:
```
Base: https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/
Path: hello.mp4
Full: https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/hello.mp4
```

**In Cloudflare R2**:
```
islvideos/
└── hello.mp4  ← Video location
```

### Example 2: Video in Animated Folder

**Database**:
```
video_name = 'Animated/hello.mp4'
```

**URL Construction**:
```
Base: https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/
Path: Animated/hello.mp4
Full: https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/Animated/hello.mp4
```

**In Cloudflare R2**:
```
islvideos/
└── Animated/
    └── hello.mp4  ← Video location
```

### Example 3: Video in First_R2 Folder

**Database**:
```
video_name = 'First_R2/thank_you.mp4'
```

**URL Construction**:
```
Base: https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/
Path: First_R2/thank_you.mp4
Full: https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/First_R2/thank_you.mp4
```

**In Cloudflare R2**:
```
islvideos/
└── First_R2/
    └── thank_you.mp4  ← Video location
```

---

## How to Get the Correct Paths

### Method 1: Check Cloudflare Console
1. Go to Cloudflare R2 console
2. Open `islvideos` bucket
3. Navigate to where your video is
4. Copy the file path from root

**Example**: If you see `Animated/` folder → video `hello.mp4`
- Path to use: `Animated/hello.mp4`

### Method 2: Use Cloudflare Public URL
1. In Cloudflare R2, select a video
2. Copy the public URL
3. Extract the path after `r2.dev/`

**Example**: 
```
Full URL: https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/Animated/hello.mp4
Extract: Animated/hello.mp4
```

---

## Common Path Scenarios

### Your Bucket Structure

Based on your screenshot, here are common path patterns:

```
Root Level:
  ├── hello.mp4                    → Path: "hello.mp4"
  ├── world.mp4                    → Path: "world.mp4"

Animated Folder:
  └── Animated/
      ├── dancing.mp4              → Path: "Animated/dancing.mp4"
      ├── running.mp4              → Path: "Animated/running.mp4"

First_R2 Folder:
  └── First_R2/
      ├── lesson1.mp4              → Path: "First_R2/lesson1.mp4"
      ├── lesson2.mp4              → Path: "First_R2/lesson2.mp4"

Second_R2 Folder:
  └── Second_R2/
      ├── advanced1.mp4            → Path: "Second_R2/advanced1.mp4"

Third_R2 Folder:
  └── Third_R2/
      ├── complex.mp4              → Path: "Third_R2/complex.mp4"

Fourth_R2 Folder:
  └── Fourth_R2/
      ├── expert.mp4               → Path: "Fourth_R2/expert.mp4"
```

---

## Database Setup Examples

### Complete Setup with Mixed Folders

```sql
-- Topics with videos in different locations
INSERT INTO topics (lesson_id, topic_name, video_name) VALUES
(1, 'Basic Greetings', 'hello_world.mp4'),              -- Root
(1, 'Animated Signs', 'Animated/dancing_signs.mp4'),    -- Animated folder
(2, 'First Level', 'First_R2/lesson1.mp4'),             -- First_R2 folder
(2, 'Second Level', 'Second_R2/advanced.mp4'),          -- Second_R2 folder
(3, 'Advanced', 'Third_R2/complex_signs.mp4'),          -- Third_R2 folder
(3, 'Expert', 'Fourth_R2/expert_level.mp4');            -- Fourth_R2 folder

-- Word videos in different locations
INSERT INTO isl_words (word_name, video_name) VALUES
('hello', 'hello.mp4'),                     -- Root
('world', 'world.mp4'),                     -- Root
('dance', 'Animated/dance.mp4'),            -- Animated
('jump', 'Animated/jump.mp4'),              -- Animated
('thank', 'First_R2/thank.mp4'),            -- First_R2
('you', 'First_R2/you.mp4'),                -- First_R2
('please', 'Second_R2/please.mp4'),         -- Second_R2
('sorry', 'Second_R2/sorry.mp4'),           -- Second_R2
('amazing', 'Third_R2/amazing.mp4'),        -- Third_R2
('wonderful', 'Fourth_R2/wonderful.mp4');   -- Fourth_R2
```

---

## Troubleshooting

### Videos Not Playing (404 Errors)

**Check 1: Verify the path in database**
```sql
-- Check what paths are stored
SELECT video_name FROM topics LIMIT 5;
SELECT word_name, video_name FROM isl_words LIMIT 5;
```

**Check 2: Verify video exists in Cloudflare**
- Go to R2 console
- Navigate to the path you have in database
- Confirm file exists

**Check 3: Test the URL**
```
If database has: "Animated/hello.mp4"
Test this URL: https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/Animated/hello.mp4
```

**Check 4: Browser console**
- Open DevTools → Network tab
- Check if video requests return 404
- Look at the full URL being requested

### Common Mistakes

❌ **Incorrect**: Including bucket name in path
```
WRONG: islvideos/Animated/hello.mp4
RIGHT: Animated/hello.mp4
```

❌ **Incorrect**: Wrong folder name
```
WRONG: Animation/hello.mp4 (when folder is "Animated")
RIGHT: Animated/hello.mp4
```

❌ **Incorrect**: Extra slashes
```
WRONG: /Animated/hello.mp4 (leading slash)
RIGHT: Animated/hello.mp4
```

❌ **Incorrect**: Wrong extension
```
WRONG: Animated/hello.MP4 (when file is .mp4)
RIGHT: Animated/hello.mp4
```

---

## Frontend Code Reference

### How URLs are Built

```javascript
// In TopicDetail.jsx
const CLOUDFLARE_PUBLIC_URL = 'https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/'

// For topic video
const videoUrl = `${CLOUDFLARE_PUBLIC_URL}${foundTopic.video_name}`
// If video_name is "Animated/hello.mp4"
// Result: https://pub-xxx.r2.dev/Animated/hello.mp4

// For word videos
const getCurrentWordVideoUrl = () => {
  const videoName = wordVideos[currentWordVideoIndex].video_name
  return `${CLOUDFLARE_PUBLIC_URL}${videoName}`
  // If video_name is "First_R2/thank.mp4"
  // Result: https://pub-xxx.r2.dev/First_R2/thank.mp4
}
```

### No Code Changes Needed

The frontend code already handles all folder structures correctly. Just ensure your database has the correct paths!

---

## Verification Checklist

- [ ] Video exists in Cloudflare R2 bucket
- [ ] Database `video_name` includes folder path (if not in root)
- [ ] Path uses forward slashes `/` (not backslashes)
- [ ] No leading slashes in path
- [ ] Folder name matches exactly (case-sensitive)
- [ ] File extension matches exactly (.mp4, not .MP4)
- [ ] Test URL works when pasted in browser

---

## Quick Copy-Paste Examples

Based on your bucket structure, here are ready-to-use database entries:

```sql
-- Use these as templates, update as needed

-- Root level videos
INSERT INTO isl_words (word_name, video_name) VALUES ('hello', 'hello.mp4');
INSERT INTO isl_words (word_name, video_name) VALUES ('world', 'world.mp4');

-- Animated folder videos
INSERT INTO isl_words (word_name, video_name) VALUES ('dance', 'Animated/dance.mp4');
INSERT INTO isl_words (word_name, video_name) VALUES ('move', 'Animated/move.mp4');

-- First_R2 folder videos
INSERT INTO isl_words (word_name, video_name) VALUES ('thank', 'First_R2/thank.mp4');
INSERT INTO isl_words (word_name, video_name) VALUES ('you', 'First_R2/you.mp4');

-- Second_R2 folder videos
INSERT INTO isl_words (word_name, video_name) VALUES ('please', 'Second_R2/please.mp4');
INSERT INTO isl_words (word_name, video_name) VALUES ('sorry', 'Second_R2/sorry.mp4');

-- Third_R2 folder videos
INSERT INTO isl_words (word_name, video_name) VALUES ('amazing', 'Third_R2/amazing.mp4');

-- Fourth_R2 folder videos
INSERT INTO isl_words (word_name, video_name) VALUES ('wonderful', 'Fourth_R2/wonderful.mp4');
```

---

## Summary

✅ **Frontend**: Already correctly handles any folder structure
✅ **Cloudflare**: Your R2 bucket with multiple folders
✅ **Database**: Must include full path (folder + filename)
✅ **URL**: Automatically constructed with base URL + path

**Just ensure your `video_name` column includes the folder path, and everything will work!**

---

**Last Updated**: January 1, 2026
**Status**: ✅ Complete
