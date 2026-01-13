// APIs/sentencesfetch.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

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

// GET /sentences/topic/:topicId -> get all sentences for a specific topic
router.get('/topic/:topicId', verifyToken, async (req, res) => {
  try {
    const { topicId } = req.params;

    // Validate topicId
    if (!topicId || isNaN(topicId)) {
      return res.status(400).json({ ok: false, message: 'Invalid topic ID' });
    }

    // Get user ID from token
    const token = req.cookies.token;
    const jwt = require('jsonwebtoken');
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.id;
      } catch (err) {
        console.log('Token verification failed:', err.message);
      }
    }

    // Get topic details first
    const topicQuery = 'SELECT id, topic, lesson_id FROM topics WHERE id = $1';
    const topicResult = await db.query(topicQuery, [topicId]);

    if (topicResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Topic not found' });
    }

    const topicData = topicResult.rows[0];

    // Get all sentences for this topic
    const sentencesQuery = `
      SELECT id, topic_id, sentence, created_at
      FROM sentences
      WHERE topic_id = $1
      ORDER BY id ASC
    `;
    const sentencesResult = await db.query(sentencesQuery, [topicId]);

    // Combine data (without user progress for now)
    const sentencesWithProgress = sentencesResult.rows.map(sentence => ({
      id: sentence.id,
      topic_id: sentence.topic_id,
      sentence: sentence.sentence,
      completed: false,
      created_at: sentence.created_at
    }));

    res.json({
      ok: true,
      topic: {
        id: topicData.id,
        title: topicData.topic,
        lesson_id: topicData.lesson_id
      },
      sentences: sentencesWithProgress
    });
  } catch (err) {
    console.error('Error fetching sentences:', err);
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

// POST /sentences/progress -> update sentence completion status
router.post('/progress', verifyToken, async (req, res) => {
  try {
    const { sentenceId, completed } = req.body;

    // Validate inputs
    if (!sentenceId || isNaN(sentenceId) || typeof completed !== 'boolean') {
      return res.status(400).json({ ok: false, message: 'Invalid input' });
    }

    // For now, just return success without storing progress
    // This will be implemented once user_sentence_progress table is created
    res.json({
      ok: true,
      message: 'Sentence progress recorded',
      sentenceId,
      completed
    });
  } catch (err) {
    console.error('Error updating sentence progress:', err);
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

// GET /sentences/words/:sentenceText -> fetch videos for words in a sentence
router.get('/words/:sentenceText', async (req, res) => {
  try {
    const { sentenceText } = req.params;

    if (!sentenceText || sentenceText.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Sentence text cannot be empty' 
      });
    }

    // Extract words from sentence
    // Remove punctuation, convert to lowercase, split by spaces
    const words = sentenceText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')           // Remove special characters and punctuation
      .split(/\s+/)                      // Split by whitespace
      .filter(word => word.length > 0 && word.length < 50); // Remove empty/too long strings

    if (words.length === 0) {
      return res.json({ 
        ok: true, 
        videos: [],
        words: [],
        message: 'No valid words found in sentence'
      });
    }

    console.log('Sentence:', sentenceText);
    console.log('Extracted words:', words);

    // Query isl_words table for matching word videos
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

    if (result.rows.length === 0) {
      return res.json({ 
        ok: true, 
        videos: [],
        words: words,
        message: 'No videos found for the words in this sentence'
      });
    }

    // Format response with video data
    const videos = result.rows.map((row) => ({
      id: row.id,
      word_name: row.word,
      video_name: row.video_name
    }));

    return res.json({ 
      ok: true, 
      videos,
      words: words,
      totalVideos: videos.length,
      sentenceText: sentenceText
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

module.exports = router;
