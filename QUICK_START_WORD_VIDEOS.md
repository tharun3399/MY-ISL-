# Quick Start: Adding Words to Play Videos

## TL;DR - 30 Second Setup

### 1. Open your PostgreSQL database
```bash
psql -h localhost -p 3133 -U postgres -d demodb
```

### 2. Run this SQL to create table and add sample words:
```sql
CREATE TABLE IF NOT EXISTS isl_words (
  id SERIAL PRIMARY KEY,
  word_name VARCHAR(255) UNIQUE NOT NULL,
  video_name VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add sample words (update video paths to match your Cloudflare R2)
INSERT INTO isl_words (word_name, video_name) VALUES
('hello', 'hello.mp4'),
('how', 'how.mp4'),
('are', 'are.mp4'),
('you', 'Animated/you.mp4'),
('thank', 'First_R2/thank.mp4'),
('world', 'world.mp4');
```

### 3. Test it
- Go to your app and click on a topic that contains those words
- You should see word videos appear!

---

## What You're Setting Up

When user clicks topic "Hello, How are you":
1. System splits it: `["hello", "how", "are", "you"]`
2. Looks up in database for each word
3. Finds matching videos: `hello.mp4`, `how.mp4`, `you.mp4`
4. Shows them in carousel (skips "are" because no video)

---

## Video Path Rules

**In Root Directory**:
```sql
('hello', 'hello.mp4')
```

**In Subfolders**:
```sql
('hello', 'Animated/hello.mp4')
('thank', 'First_R2/thank.mp4')
('love', 'Second_R2/love.mp4')
```

**Key**: Use forward slashes `/`, no leading slashes, no bucket name

---

## Verify It Worked

```sql
-- Check table exists
SELECT * FROM isl_words LIMIT 5;

-- Should show your inserted words
```

---

## Troubleshooting

**Nothing shows up?**
- Check isl_words table has data: `SELECT COUNT(*) FROM isl_words;`
- Check word names match (case-insensitive): `SELECT word_name FROM isl_words;`
- Make sure videos actually exist in Cloudflare R2

**404 errors on videos?**
- Verify video path in database: `SELECT video_name FROM isl_words WHERE word_name='hello';`
- Test the URL: `https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/[path]`

---

## Full Documentation

See:
- `ISL_WORDS_SETUP_GUIDE.md` - Complete setup with examples
- `CLOUDFLARE_R2_PATH_CONFIGURATION.md` - Path configuration
- `WORD_VIDEO_FEATURE_COMPLETE.md` - Full feature documentation

---

**That's it! Restart your backend and you're done.**
