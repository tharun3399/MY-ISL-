# ISL Words Table Setup Guide

## Overview

The word-by-word video feature splits topic names into individual words and displays their corresponding videos. For example, the topic "Hello, How are you" gets split into: `hello`, `how`, `are`, `you`, and the system looks for videos for each of these words in the `isl_words` table.

## Database Table Structure

The `isl_words` table has the following structure:

```sql
CREATE TABLE isl_words (
  id SERIAL PRIMARY KEY,
  word_name VARCHAR(255) UNIQUE NOT NULL,
  video_name VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields**:
- `id`: Unique identifier for each word
- `word_name`: The word (e.g., "hello", "world", "thank")
- `video_name`: The full path to the video file in Cloudflare R2 (e.g., "hello.mp4" or "Animated/hello.mp4")
- `created_at`: Timestamp when the record was created

## How It Works

### Example Flow

**Topic name**: "Hello, How are you"

**Step 1: Split Topic**
```
Original: "Hello, How are you"
After removing special chars: "Hello How are you"
After converting to lowercase: "hello how are you"
Words extracted: ["hello", "how", "are", "you"]
```

**Step 2: Query Database**
```sql
SELECT id, word_name, video_name 
FROM isl_words 
WHERE LOWER(word_name) = ANY(['hello', 'how', 'are', 'you'])
ORDER BY id ASC
```

**Step 3: Results**
```
If these words exist in the table:
- hello → hello.mp4
- how → how.mp4
- are → (missing from table, will be skipped)
- you → Animated/you.mp4
```

**Step 4: Display Videos**
- Show carousel with 3 videos: hello, how, you
- The word "are" is silently skipped because it's not in the database
- User can navigate with Previous/Next buttons

## Adding Words to the Table

### Method 1: Insert Individual Words

```sql
-- Simple words in root directory
INSERT INTO isl_words (word_name, video_name) VALUES
('hello', 'hello.mp4'),
('world', 'world.mp4'),
('how', 'how.mp4'),
('are', 'are.mp4'),
('you', 'you.mp4'),
('thank', 'thank.mp4'),
('please', 'please.mp4'),
('yes', 'yes.mp4'),
('no', 'no.mp4'),
('sorry', 'sorry.mp4');

-- Words with videos in Animated folder
INSERT INTO isl_words (word_name, video_name) VALUES
('dance', 'Animated/dance.mp4'),
('jump', 'Animated/jump.mp4'),
('run', 'Animated/run.mp4'),
('walk', 'Animated/walk.mp4');

-- Words with videos in First_R2 folder
INSERT INTO isl_words (word_name, video_name) VALUES
('love', 'First_R2/love.mp4'),
('friend', 'First_R2/friend.mp4'),
('family', 'First_R2/family.mp4');

-- Words with videos in Second_R2 folder
INSERT INTO isl_words (word_name, video_name) VALUES
('amazing', 'Second_R2/amazing.mp4'),
('wonderful', 'Second_R2/wonderful.mp4'),
('beautiful', 'Second_R2/beautiful.mp4');
```

### Method 2: Bulk Insert from CSV

If you have many words, create a CSV file and import:

```sql
COPY isl_words (word_name, video_name) 
FROM '/path/to/words.csv' 
DELIMITER ',' 
CSV HEADER;
```

**CSV file format** (`words.csv`):
```
word_name,video_name
hello,hello.mp4
world,world.mp4
how,how.mp4
are,are.mp4
you,Animated/you.mp4
thank,First_R2/thank.mp4
please,Second_R2/please.mp4
```

### Method 3: Interactive PostgreSQL Insert

```bash
# Connect to your database
psql -h localhost -p 3133 -U postgres -d demodb

# Then run:
INSERT INTO isl_words (word_name, video_name) VALUES ('hello', 'hello.mp4');
INSERT INTO isl_words (word_name, video_name) VALUES ('world', 'world.mp4');
-- ... and so on
```

## Important Rules

### Rule 1: Video Path Format
The `video_name` must include the folder path if the video is in a subfolder:

✅ **Correct**:
```
hello.mp4                    (root directory)
Animated/hello.mp4          (Animated folder)
First_R2/thank.mp4          (First_R2 folder)
Second_R2/amazing.mp4       (Second_R2 folder)
```

❌ **Incorrect**:
```
/hello.mp4                   (leading slash)
hello.MP4                    (wrong extension case)
/Animated/hello.mp4          (leading slash)
Animated\hello.mp4           (backslash instead of forward slash)
islvideos/hello.mp4          (includes bucket name)
```

### Rule 2: Word Name Case Sensitivity
Words are stored in lowercase and searches are case-insensitive:

- "Hello" in topic → searches for "hello" in database ✅
- "WORLD" in topic → searches for "world" in database ✅
- Store as lowercase: "hello", "world", "thank" ✅

### Rule 3: Special Characters
Topic special characters are removed before searching:

- "Hello, How are you?" → splits into ["hello", "how", "are", "you"]
- "Hello-World" → splits into ["hello", "world"]
- "Hi's" → splits into ["hi", "s"] or ["his"] depending on removal

## Practical Examples

### Example 1: Basic Greeting Videos

```sql
INSERT INTO isl_words (word_name, video_name) VALUES
('hello', 'hello.mp4'),
('hi', 'hi.mp4'),
('how', 'how.mp4'),
('are', 'are.mp4'),
('you', 'you.mp4'),
('fine', 'fine.mp4'),
('good', 'good.mp4'),
('morning', 'morning.mp4'),
('afternoon', 'afternoon.mp4'),
('evening', 'evening.mp4');
```

**Topics that would work**:
- "Hello, how are you?" → Shows videos for: hello, how, are, you
- "Hi, how are you doing?" → Shows videos for: hi, how, are, you (doing is skipped)
- "Good morning" → Shows videos for: good, morning

### Example 2: Animated Sign Videos

```sql
INSERT INTO isl_words (word_name, video_name) VALUES
('dance', 'Animated/dance.mp4'),
('jump', 'Animated/jump.mp4'),
('run', 'Animated/run.mp4'),
('walk', 'Animated/walk.mp4'),
('sit', 'Animated/sit.mp4'),
('stand', 'Animated/stand.mp4');
```

**Topics that would work**:
- "Dance and jump" → Shows videos for: dance, and, jump (and is skipped if not in DB)
- "Let's run" → Shows videos for: let's, run (let's is skipped if not in DB)

### Example 3: Mixed Folder Organization

```sql
-- Root level
INSERT INTO isl_words (word_name, video_name) VALUES
('hello', 'hello.mp4'),
('goodbye', 'goodbye.mp4');

-- Animated folder
INSERT INTO isl_words (word_name, video_name) VALUES
('dance', 'Animated/dance.mp4'),
('jump', 'Animated/jump.mp4');

-- First_R2 folder
INSERT INTO isl_words (word_name, video_name) VALUES
('love', 'First_R2/love.mp4'),
('friend', 'First_R2/friend.mp4');

-- Second_R2 folder
INSERT INTO isl_words (word_name, video_name) VALUES
('wonderful', 'Second_R2/wonderful.mp4'),
('amazing', 'Second_R2/amazing.mp4');
```

**Topics that would work**:
- "Hello dance love wonderful" → Shows 4 videos from different folders
- "Goodbye jump friend amazing" → Shows 4 videos from different folders

## Checking Your Data

### Check if table exists:
```sql
SELECT * FROM isl_words LIMIT 5;
```

### Check all words:
```sql
SELECT word_name, video_name FROM isl_words ORDER BY word_name ASC;
```

### Check words by folder:
```sql
-- Root directory words
SELECT word_name, video_name FROM isl_words WHERE video_name NOT LIKE '%/%' ORDER BY word_name;

-- Words in subfolders
SELECT word_name, video_name FROM isl_words WHERE video_name LIKE '%/%' ORDER BY word_name;

-- Words in Animated folder
SELECT word_name, video_name FROM isl_words WHERE video_name LIKE 'Animated/%';

-- Words in First_R2 folder
SELECT word_name, video_name FROM isl_words WHERE video_name LIKE 'First_R2/%';
```

### Check total word count:
```sql
SELECT COUNT(*) as total_words FROM isl_words;
```

### Search for specific word:
```sql
SELECT * FROM isl_words WHERE LOWER(word_name) = 'hello';
```

## Handling Duplicates

If you try to insert a word that already exists, you'll get an error because `word_name` is UNIQUE.

**Option 1: Update existing word**
```sql
UPDATE isl_words 
SET video_name = 'Animated/hello_new.mp4' 
WHERE LOWER(word_name) = 'hello';
```

**Option 2: Delete and re-insert**
```sql
DELETE FROM isl_words WHERE LOWER(word_name) = 'hello';
INSERT INTO isl_words (word_name, video_name) VALUES ('hello', 'hello.mp4');
```

**Option 3: Use INSERT ... ON CONFLICT**
```sql
INSERT INTO isl_words (word_name, video_name) 
VALUES ('hello', 'hello.mp4')
ON CONFLICT (word_name) 
DO UPDATE SET video_name = 'hello.mp4';
```

## Troubleshooting

### Problem: Video not showing in carousel
**Check**: Does the word exist in isl_words table with correct case?
```sql
SELECT * FROM isl_words WHERE LOWER(word_name) = 'hello';
```

### Problem: Carousel is empty
**Possible causes**:
1. Topic has no matching words in isl_words table
2. Topic name is entirely special characters
3. Words were stored with different casing (should be lowercase)

### Problem: 404 error for video
**Check**: Is the video_name path correct?
```sql
-- Verify the path
SELECT word_name, video_name FROM isl_words WHERE word_name = 'hello';

-- Test the URL manually:
-- https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/[video_name]
```

### Problem: Special characters in topic causing issues
**Example**: "Hello, how are you?" 
- The comma is removed during processing
- So it becomes: "hello how are you"
- Make sure your words match the cleaned version

## Complete Setup Script

Here's a ready-to-use SQL script to create the table and add sample data:

```sql
-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS isl_words (
  id SERIAL PRIMARY KEY,
  word_name VARCHAR(255) UNIQUE NOT NULL,
  video_name VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_isl_words_word_name ON isl_words(LOWER(word_name));

-- Insert sample data
INSERT INTO isl_words (word_name, video_name) VALUES
-- Basic greetings
('hello', 'hello.mp4'),
('hi', 'hi.mp4'),
('how', 'how.mp4'),
('are', 'are.mp4'),
('you', 'you.mp4'),
('fine', 'fine.mp4'),
('good', 'good.mp4'),

-- Animated signs
('dance', 'Animated/dance.mp4'),
('jump', 'Animated/jump.mp4'),
('run', 'Animated/run.mp4'),

-- First_R2 folder
('love', 'First_R2/love.mp4'),
('friend', 'First_R2/friend.mp4'),

-- Second_R2 folder
('amazing', 'Second_R2/amazing.mp4'),
('wonderful', 'Second_R2/wonderful.mp4')

ON CONFLICT (word_name) DO NOTHING;

-- Verify insertion
SELECT COUNT(*) as total_words FROM isl_words;
```

## Next Steps

1. **Create the table** (if it doesn't exist)
2. **Add sample words** matching your Cloudflare R2 videos
3. **Test with topics** that contain those words
4. **Expand gradually** as you add more videos to your R2 bucket

## Verification Checklist

- [ ] `isl_words` table exists and has data
- [ ] Word names are lowercase
- [ ] Video paths include folder names (e.g., "Animated/video.mp4")
- [ ] Video files actually exist in Cloudflare R2
- [ ] Topic names contain at least one word that exists in isl_words
- [ ] Test topics work: "Hello how are you" shows videos for available words

---

**Status**: ✅ Feature Complete - Just needs sample data in isl_words table

**Last Updated**: January 1, 2026
