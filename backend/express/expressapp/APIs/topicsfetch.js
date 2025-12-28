// APIs/topicsfetch.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // shared pool
const { verifyToken } = require('../middleware/auth');

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

module.exports = router;
