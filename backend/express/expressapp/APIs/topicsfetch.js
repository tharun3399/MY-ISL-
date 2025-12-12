// APIs/topicsfetch.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // shared pool
const { verifyToken } = require('../middleware/auth');

// GET /topics/lesson/:lessonId -> get all topics for a specific lesson
router.get('/lesson/:lessonId', verifyToken, async (req, res) => {
  try {
    const { lessonId } = req.params;

    // Validate lessonId
    if (!lessonId || isNaN(lessonId)) {
      return res.status(400).json({ ok: false, message: 'Invalid lesson ID' });
    }

    // Query to fetch topics assigned to the given lesson
    const q = `
      SELECT 
        id,
        lesson_id,
        topic_name
      FROM topics 
      WHERE lesson_id = $1
      ORDER BY id ASC
    `;

    const result = await db.query(q, [lessonId]);

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
      number: index + 1 // Add sequential number for display
    }));

    return res.json({ 
      ok: true, 
      topics,
      totalTopics: topics.length
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

module.exports = router;
