// APIs/topicsfetch.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // shared pool
const { verifyToken } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Video concatenation utilities
const downloadVideo = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const chunks = [];

    protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${res.statusCode}`));
        return;
      }

      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    }).on('error', reject);
  });
};

const createConcatFile = (videoPaths) => {
  return videoPaths
    .map(videoPath => `file '${videoPath.replace(/'/g, "'\\''")}'`)
    .join('\n');
};

// GET /topics/lesson/:lessonId -> get all topics for a specific lesson with completion status
router.get('/lesson/:lessonId', verifyToken, async (req, res) => {
  try {
    const { lessonId } = req.params;

    // Validate lessonId
    if (!lessonId || isNaN(lessonId)) {
      return res.status(400).json({ ok: false, message: 'Invalid lesson ID' });
    }

    // Get user ID from token
    const token = req.cookies.token;
    const jwt = require('jsonwebtoken');
    let userId = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-this');
      // Fetch user to get their ID
      const userResult = await db.query('SELECT id FROM "userinfo" WHERE LOWER(email) = LOWER($1)', [decoded.email]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      }
    } catch (err) {
      console.warn('Could not extract user ID from token');
    }

    // Query to fetch topics assigned to the given lesson with completion status
    const q = `
      SELECT 
        t.id,
        t.lesson_id,
        t.topic_name,
        t.video_name,
        COALESCE(utp.completed, false) as completed
      FROM topics t
      LEFT JOIN user_topic_progress utp ON t.id = utp.topic_id AND utp.user_id = $2
      WHERE t.lesson_id = $1
      ORDER BY t.id ASC
    `;

    const result = await db.query(q, [lessonId, userId]);

    if (result.rows.length === 0) {
      return res.json({ 
        ok: true, 
        topics: [],
        message: 'No topics found for this lesson'
      });
    }

    // Format the topics data
    const topics = result.rows.map((row, index) => ({
      id: row.id,
      lesson_id: row.lesson_id,
      topic_name: row.topic_name,
      video_name: row.video_name,
      completed: row.completed,
      number: index + 1 // Add sequential number for display
    }));

    return res.json({ 
      ok: true, 
      topics,
      totalTopics: topics.length,
      completedCount: topics.filter(t => t.completed).length
    });
  } catch (err) {
    console.error('Topics fetch error:', err);
    return res.status(500).json({ 
      ok: false, 
      message: 'Error fetching topics',
      error: err.message
    });
  }
});

// GET /topics -> get all topics
router.get('/', verifyToken, async (req, res) => {
  try {
    const q = `
      SELECT 
        id,
        lesson_id,
        topic_name
      FROM topics 
      ORDER BY lesson_id, id ASC
    `;

    const result = await db.query(q);

    if (result.rows.length === 0) {
      return res.json({ 
        ok: true, 
        topics: [],
        message: 'No topics found'
      });
    }

    return res.json({ 
      ok: true, 
      topics: result.rows,
      totalTopics: result.rows.length
    });
  } catch (err) {
    console.error('Topics fetch error:', err);
    return res.status(500).json({ 
      ok: false, 
      message: 'Error fetching all topics',
      error: err.message
    });
  }
});

// GET /topics/search -> search topics by name
router.get('/search/:query', verifyToken, async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ ok: false, message: 'Search query cannot be empty' });
    }

    const q = `
      SELECT 
        id,
        lesson_id,
        topic_name
      FROM topics 
      WHERE LOWER(topic_name) LIKE LOWER($1)
      ORDER BY lesson_id, id ASC
    `;

    const result = await db.query(q, [`%${query}%`]);

    return res.json({ 
      ok: true, 
      topics: result.rows,
      totalTopics: result.rows.length
    });
  } catch (err) {
    console.error('Topics search error:', err);
    return res.status(500).json({ 
      ok: false, 
      message: 'Error searching topics',
      error: err.message
    });
  }
});

// GET /topics/word/:wordName -> fetch a single word video from isl_words table
router.get('/word/:wordName', verifyToken, async (req, res) => {
  try {
    const { wordName } = req.params;

    if (!wordName || wordName.trim().length === 0) {
      return res.status(400).json({ ok: false, message: 'Word name cannot be empty' });
    }

    // Query to fetch a single word from isl_words table
    const q = `
      SELECT 
        id,
        word,
        video_name
      FROM isl_words
      WHERE LOWER(word) = LOWER($1)
      LIMIT 1
    `;

    const result = await db.query(q, [wordName]);

    console.log('Searching for word:', wordName);
    console.log('Found:', result.rows.length > 0 ? 'Yes' : 'No');

    if (result.rows.length === 0) {
      return res.json({ 
        ok: true, 
        found: false,
        word: wordName,
        message: 'Word not found in isl_words table'
      });
    }

    const wordData = result.rows[0];
    const cloudflareBaseUrl = 'https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/';
    const directories = ['First_R2', 'Second_R2', 'Third_R2', 'Fourth_R2', 'Animated'];
    
    // Generate URLs for all directories so the frontend can try each one
    const urlOptions = directories.map(dir => 
      `${cloudflareBaseUrl}${dir}/${wordData.video_name}`
    );

    return res.json({ 
      ok: true, 
      found: true,
      word: wordData.word,
      video_name: wordData.video_name,
      url_options: urlOptions,
      full_url: urlOptions[0] // Default to first option
    });
  } catch (err) {
    console.error('Word fetch error:', err);
    
    if (err.message && err.message.includes('does not exist')) {
      return res.json({ 
        ok: true, 
        found: false,
        message: 'isl_words table is being initialized'
      });
    }
    
    return res.status(500).json({ 
      ok: false, 
      message: 'Error fetching word',
      error: err.message
    });
  }
});

// Ensure isl_words table exists
const ensureIslWordsTable = async () => {
  try {
    const checkTableQuery = `
      SELECT to_regclass('public.isl_words');
    `;
    const result = await db.query(checkTableQuery);
    
    if (!result.rows[0].to_regclass) {
      console.log('isl_words table does not exist, creating it...');
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS isl_words (
          id SERIAL PRIMARY KEY,
          word_name VARCHAR(255) UNIQUE NOT NULL,
          video_name VARCHAR(500) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_isl_words_word_name ON isl_words(LOWER(word_name));
      `;
      await db.query(createTableQuery);
      console.log('isl_words table created successfully');
    }
  } catch (err) {
    console.warn('Could not ensure isl_words table:', err.message);
  }
};

// Initialize table on startup
ensureIslWordsTable();

// GET /topics/words/:topicName -> fetch all word videos for a topic by splitting the topic name
router.get('/words/:topicName', verifyToken, async (req, res) => {
  try {
    const { topicName } = req.params;

    if (!topicName || topicName.trim().length === 0) {
      return res.status(400).json({ ok: false, message: 'Topic name cannot be empty' });
    }

    // Split topic name into words (remove special characters, convert to lowercase)
    const words = topicName
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 0); // Remove empty strings

    if (words.length === 0) {
      return res.status(400).json({ ok: false, message: 'No valid words found in topic name' });
    }

    console.log('Topic name:', topicName);
    console.log('Extracted words:', words);

    // Query to fetch all videos for the extracted words from isl_words table
    // Only include words that have videos - missing words are silently ignored
    const q = `
      SELECT 
        id,
        word,
        video_name
      FROM isl_words
      WHERE LOWER(word) = ANY($1)
      ORDER BY id ASC
    `;

    const result = await db.query(q, [words]);

    console.log(`Found ${result.rows.length} videos for ${words.length} words`);

    if (result.rows.length === 0) {
      return res.json({ 
        ok: true, 
        videos: [],
        words: words,
        foundWords: [],
        message: 'No videos found for the words in this topic (this is okay, showing only available words)'
      });
    }

    // Format the videos data with directory detection
    const cloudflareBaseUrl = 'https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/';
    const directories = ['First_R2', 'Second_R2', 'Third_R2', 'Fourth_R2', 'Animated'];
    
    // Helper function to check if a URL is accessible
    const checkUrlAccessibility = async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD', timeout: 3000 });
        return response.ok;
      } catch (err) {
        return false;
      }
    };
    
    // Process each video and find the correct directory
    const videos = await Promise.all(result.rows.map(async (row) => {
      // Try all directories to find where the video exists
      let foundUrl = null;
      let foundDirectory = null;
      
      for (const dir of directories) {
        const testUrl = `${cloudflareBaseUrl}${dir}/${row.video_name}`;
        try {
          const isAccessible = await checkUrlAccessibility(testUrl);
          if (isAccessible) {
            foundUrl = testUrl;
            foundDirectory = dir;
            console.log(`✓ Found video in ${dir}: ${row.video_name}`);
            break; // Stop at first match
          }
        } catch (err) {
          // Continue to next directory
          console.log(`  Checking ${dir}/${row.video_name}... (not found)`);
        }
      }
      
      return {
        id: row.id,
        word_name: row.word,
        video_name: row.video_name,
        url: foundUrl, // Single working URL, or null if not found
        directory: foundDirectory, // Which directory has the video
        all_url_options: directories.map(dir => `${cloudflareBaseUrl}${dir}/${row.video_name}`), // All options tried
        available: foundUrl !== null
      };
    }));
    
    // Filter only available videos
    const availableVideos = videos.filter(v => v.available);

    // Track which words were found
    const foundWords = availableVideos.map(v => v.word_name.toLowerCase());

    console.log(`\n📊 VIDEO SEARCH RESULTS:`);
    console.log(`Total words requested: ${words.length}`);
    console.log(`Total videos in DB: ${result.rows.length}`);
    console.log(`Videos found in directories: ${availableVideos.length}`);
    console.log(`Directory distribution:`);
    const dirStats = {};
    availableVideos.forEach(v => {
      dirStats[v.directory] = (dirStats[v.directory] || 0) + 1;
    });
    Object.entries(dirStats).forEach(([dir, count]) => {
      console.log(`  ${dir}: ${count} videos`);
    });

    return res.json({ 
      ok: true, 
      videos: availableVideos,
      all_videos: videos, // Include all for debugging
      words: words,
      foundWords: foundWords,
      totalWords: words.length,
      totalVideos: availableVideos.length,
      totalVideoEntries: result.rows.length,
      topicName: topicName
    });
  } catch (err) {
    console.error('Word videos fetch error:', err);
    
    // If it's a table doesn't exist error, return empty videos instead of error
    if (err.message && err.message.includes('does not exist')) {
      return res.json({ 
        ok: true, 
        videos: [],
        words: [],
        message: 'isl_words table is being initialized'
      });
    }
    
    return res.status(500).json({ 
      ok: false, 
      message: 'Error fetching word videos',
      error: err.message
    });
  }
});

// POST /topics/merge-videos/:topicName -> concatenate all available videos into one
router.post('/merge-videos/:topicName', verifyToken, async (req, res) => {
  try {
    const { topicName } = req.params;
    const { videoUrls } = req.body;

    if (!topicName || topicName.trim().length === 0) {
      return res.status(400).json({ ok: false, message: 'Topic name is required' });
    }

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return res.status(400).json({ ok: false, message: 'At least one video URL is required' });
    }

    console.log(`\n🎬 VIDEO MERGE REQUEST`);
    console.log(`Topic: ${topicName}`);
    console.log(`Videos to merge: ${videoUrls.length}`);
    
    // Check if FFmpeg is available
    const ffmpeg = require('fluent-ffmpeg');
    const { execSync } = require('child_process');
    const path = require('path');
    
    let ffmpegAvailable = false;
    let ffmpegPath = null;
    
    // Try to use ffmpeg-static first
    try {
      const ffmpegStatic = require('ffmpeg-static');
      if (ffmpegStatic) {
        ffmpeg.setFfmpegPath(ffmpegStatic);
        execSync(`${ffmpegStatic} -version`, { stdio: 'ignore' });
        ffmpegAvailable = true;
        ffmpegPath = ffmpegStatic;
        console.log(`✅ FFmpeg found (ffmpeg-static): ${ffmpegPath}`);
      }
    } catch (e) {
      console.log('ffmpeg-static not available, trying alternative paths...');
    }
    
    // If ffmpeg-static didn't work, try other common locations
    if (!ffmpegAvailable) {
      const commonPaths = [
        'ffmpeg',
        path.join(process.env.ProgramFiles, 'ffmpeg', 'bin', 'ffmpeg.exe'),
        path.join(process.env['ProgramFiles(x86)'], 'ffmpeg', 'bin', 'ffmpeg.exe'),
        'C:\\ffmpeg\\bin\\ffmpeg.exe',
        path.join(process.env.APPDATA, 'ffmpeg', 'bin', 'ffmpeg.exe')
      ];
      
      for (const ffpath of commonPaths) {
        try {
          execSync(`${ffpath} -version`, { stdio: 'ignore' });
          ffmpegAvailable = true;
          ffmpegPath = ffpath;
          ffmpeg.setFfmpegPath(ffpath);
          console.log(`✅ FFmpeg found at: ${ffmpegPath}`);
          break;
        } catch (e) {
          // Continue to next path
        }
      }
    }
    
    if (!ffmpegAvailable) {
      console.warn('⚠️ FFmpeg not found, will use sequential playback instead');
      // Fallback to sequential playback
      const mergedPlaylist = {
        topicName,
        videoUrls: videoUrls.filter(url => url && url.trim() !== ''),
        totalVideos: videoUrls.length,
        playbackType: 'sequential',
        timestamp: new Date().toISOString()
      };

      return res.json({ 
        ok: true, 
        message: 'Videos prepared for sequential playback (FFmpeg unavailable)',
        merged: mergedPlaylist
      });
    }

    // Try to concatenate with FFmpeg
    const tempDir = path.join(__dirname, '../../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputFile = path.join(tempDir, `merged_${Date.now()}_${topicName.replace(/[^a-z0-9]/gi, '_')}.mp4`);
    const concatFile = path.join(tempDir, `concat_${Date.now()}.txt`);

    console.log(`📁 Temp directory: ${tempDir}`);
    console.log(`📹 Output file: ${outputFile}`);

    // Create concat demuxer file list
    const concatContent = videoUrls
      .map(url => {
        // Escape single quotes in URLs for FFmpeg concat demuxer
        const escapedUrl = url.replace(/'/g, "'\\''");
        return `file '${escapedUrl}'`;
      })
      .join('\n');

    fs.writeFileSync(concatFile, concatContent, 'utf8');
    console.log(`✅ Created concat file with ${videoUrls.length} videos`);
    console.log(`📋 Concat file content:\n${concatContent.substring(0, 200)}...`);

    // Concatenate videos using FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFile)
        .inputFormat('concat')
        .inputOptions(['-protocol_whitelist', 'file,http,https,tcp,tls', '-safe', '0'])
        .videoCodec('copy')
        .audioCodec('copy')
        .output(outputFile)
        .on('start', (cmd) => {
          console.log(`🚀 FFmpeg command: ${cmd}`);
        })
        .on('progress', (progress) => {
          console.log(`⏳ Merging: ${progress.percent || 0}%`);
        })
        .on('end', () => {
          console.log(`✅ Videos merged successfully: ${outputFile}`);
          // Clean up concat file
          fs.unlinkSync(concatFile);
          resolve();
        })
        .on('error', (err) => {
          console.error(`❌ FFmpeg error: ${err.message}`);
          fs.unlinkSync(concatFile);
          reject(err);
        })
        .run();
    });

    // Check if output file exists and return it
    if (!fs.existsSync(outputFile)) {
      throw new Error('Merge output file was not created');
    }

    const fileStats = fs.statSync(outputFile);
    console.log(`📊 Merged video size: ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`);

    // Generate a unique ID for this merged video
    const videoId = `merged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const videoUrl = `/api/topics/stream/${videoId}`;
    
    // Store the file path mapping in memory (in production, use Redis or database)
    if (!global.mergedVideos) {
      global.mergedVideos = {};
    }
    global.mergedVideos[videoId] = outputFile;
    
    // Auto-cleanup after 1 hour
    setTimeout(() => {
      try {
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
          console.log(`🗑️ Cleaned up merged video: ${outputFile}`);
        }
        delete global.mergedVideos[videoId];
      } catch (e) {
        console.error('Error cleaning up video:', e);
      }
    }, 3600000); // 1 hour

    const mergedPlaylist = {
      topicName,
      videoUrls: [videoUrl],
      totalVideos: videoUrls.length,
      videoId: videoId,
      fileSize: fileStats.size,
      playbackType: 'merged_file',
      timestamp: new Date().toISOString(),
      expiresIn: 3600000 // 1 hour
    };

    return res.json({ 
      ok: true, 
      message: 'Videos successfully merged with FFmpeg',
      merged: mergedPlaylist
    });

  } catch (err) {
    console.error('Video merge error:', err);
    return res.status(500).json({ 
      ok: false, 
      message: 'Error merging videos',
      error: err.message
    });
  }
});

// POST /topics/progress -> update topic completion status
router.post('/progress', verifyToken, async (req, res) => {
  try {
    const { topicId, completed } = req.body;

    if (!topicId) {
      return res.status(400).json({ ok: false, message: 'Topic ID is required' });
    }

    // Get user ID from token
    const token = req.cookies.token;
    const jwt = require('jsonwebtoken');
    let userId = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-this');
      // Fetch user to get their ID
      const userResult = await db.query('SELECT id FROM "userinfo" WHERE LOWER(email) = LOWER($1)', [decoded.email]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      } else {
        return res.status(401).json({ ok: false, message: 'User not found' });
      }
    } catch (err) {
      return res.status(401).json({ ok: false, message: 'Invalid token' });
    }

    // Check if topic was previously completed
    const checkQuery = 'SELECT completed FROM user_topic_progress WHERE user_id = $1 AND topic_id = $2';
    const checkResult = await db.query(checkQuery, [userId, topicId]);
    const wasCompleted = checkResult.rows.length > 0 ? checkResult.rows[0].completed : false;

    // Insert or update user_topic_progress
    // Table structure: user_id, topic_id, completed, completed_at
    const q = `
      INSERT INTO user_topic_progress (user_id, topic_id, completed, completed_at)
      VALUES ($1, $2, $3, CASE WHEN $3 = true THEN CURRENT_TIMESTAMP ELSE NULL END)
      ON CONFLICT (user_id, topic_id)
      DO UPDATE SET completed = $3, completed_at = CASE WHEN $3 = true THEN CURRENT_TIMESTAMP ELSE NULL END
      RETURNING user_id, topic_id, completed, completed_at
    `;

    const result = await db.query(q, [userId, topicId, completed]);

    // Handle XP changes
    const xpReward = 10; // XP points per completed lesson
    
    try {
      if (completed && !wasCompleted) {
        // Marking as completed for the first time - increment XP
        await db.query(
          'UPDATE "user_learning_stats" SET xp = xp + $1 WHERE user_id = $2',
          [xpReward, userId]
        );
        console.log(`XP updated: User ${userId} earned ${xpReward} XP for completing topic ${topicId}`);
      } else if (!completed && wasCompleted) {
        // Unmarking a completed topic - decrement XP
        await db.query(
          'UPDATE "user_learning_stats" SET xp = GREATEST(xp - $1, 0) WHERE user_id = $2',
          [xpReward, userId]
        );
        console.log(`XP updated: User ${userId} lost ${xpReward} XP for uncompleting topic ${topicId}`);
      }
    } catch (xpErr) {
      console.error('Error updating XP:', xpErr);
      // Don't fail the entire request if XP update fails
    }

    return res.json({ 
      ok: true, 
      message: 'Topic progress updated successfully',
      progress: result.rows[0]
    });
  } catch (err) {
    console.error('Topic progress update error:', err);
    return res.status(500).json({ 
      ok: false, 
      message: 'Error updating topic progress',
      error: err.message
    });
  }
});

// GET /topics/stream/:videoId -> stream merged video file
router.get('/stream/:videoId', (req, res) => {
  try {
    const { videoId } = req.params;
    
    if (!global.mergedVideos || !global.mergedVideos[videoId]) {
      return res.status(404).json({ ok: false, message: 'Video not found or expired' });
    }
    
    const filePath = global.mergedVideos[videoId];
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      delete global.mergedVideos[videoId];
      return res.status(404).json({ ok: false, message: 'Video file not found' });
    }
    
    // Get file stats for streaming
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Support range requests (for seeking in video player)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      });
      
      fs.createReadStream(filePath, { start: start, end: end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes'
      });
      
      fs.createReadStream(filePath).pipe(res);
    }
    
    console.log(`📹 Streaming video: ${videoId}`);
  } catch (err) {
    console.error('Video streaming error:', err);
    return res.status(500).json({ ok: false, message: 'Error streaming video', error: err.message });
  }
});

module.exports = router;
