// APIs/lessonfetch.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // shared pool
const { verifyToken } = require('../middleware/auth');

// Colors and icons for module display
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

// Function to get relevant icon based on module name
const getIconForModule = (moduleName) => {
  const name = moduleName.toLowerCase();
  
  // Common ISL learning modules
  if (name.includes('number') || name.includes('digit') || name.includes('count')) return '🔢';
  if (name.includes('alphabet') || name.includes('letter') || name.includes('vowel')) return '🔤';
  if (name.includes('hand') || name.includes('gesture')) return '🤚';
  if (name.includes('color') || name.includes('colour')) return '🎨';
  if (name.includes('animal') || name.includes('creature')) return '🐾';
  if (name.includes('food') || name.includes('eat') || name.includes('fruit')) return '🍎';
  if (name.includes('body') || name.includes('part')) return '👤';
  if (name.includes('family') || name.includes('relation')) return '👨‍👩‍👧‍👦';
  if (name.includes('emotion') || name.includes('feeling') || name.includes('expression')) return '😊';
  if (name.includes('action') || name.includes('verb') || name.includes('activity')) return '🏃';
  if (name.includes('object') || name.includes('thing') || name.includes('item')) return '📦';
  if (name.includes('place') || name.includes('location')) return '📍';
  if (name.includes('day') || name.includes('week') || name.includes('time')) return '📅';
  if (name.includes('month') || name.includes('season')) return '📆';
  if (name.includes('weather') || name.includes('rain') || name.includes('sun')) return '⛅';
  if (name.includes('sport') || name.includes('game') || name.includes('play')) return '⚽';
  if (name.includes('question') || name.includes('ask')) return '❓';
  if (name.includes('greeting') || name.includes('hello') || name.includes('hello')) return '👋';
  if (name.includes('thank') || name.includes('please')) return '🙏';
  if (name.includes('water') || name.includes('drink')) return '💧';
  if (name.includes('school') || name.includes('education') || name.includes('learn')) return '🎓';
  if (name.includes('work') || name.includes('job')) return '💼';
  if (name.includes('house') || name.includes('home')) return '🏠';
  if (name.includes('travel') || name.includes('car') || name.includes('vehicle')) return '🚗';
  
  // Default emoji
  return '📚';
};

// Helper function to format lesson as module
const formatAsModule = (lesson, index) => ({
  id: lesson.id,
  module_name: lesson.lesson_name,
  title: lesson.lesson_name,
  description: `Learn ${lesson.lesson_name} with our interactive lessons`,
  progress: 0,
  color: COLORS[index % COLORS.length],
  icon: getIconForModule(lesson.lesson_name)
});

// GET /modules -> get list of all lessons as modules
router.get('/modules', verifyToken, async (req, res) => {
  try {
    const q = `SELECT id, lesson_name FROM lesson_names ORDER BY id`;
    const r = await db.query(q);
    
    const modules = r.rows.map((row, index) => formatAsModule(row, index));
    
    return res.json({ ok: true, modules });
  } catch (err) {
    console.error('Module fetch error:', err);
    return res.status(500).json({ ok: false, message: 'Error fetching modules' });
  }
});

// GET /modules/:id -> get module info by ID
router.get('/modules/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the specific lesson/module
    const moduleQ = `SELECT id, lesson_name FROM lesson_names WHERE id = $1`;
    const moduleR = await db.query(moduleQ, [id]);
    
    if (!moduleR.rows.length) {
      return res.status(404).json({ ok: false, message: 'Module not found' });
    }
    
    const module = formatAsModule(moduleR.rows[0], id);
    
    // NOTE: Topics for this module are now fetched via /api/topics/lesson/:lessonId endpoint
    return res.json({ ok: true, module });
  } catch (err) {
    console.error('Module fetch by id error:', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// GET /lessons -> get all lessons from lesson_names table
// NOTE: This is now redundant with /modules endpoint
router.get('/lessons', verifyToken, async (req, res) => {
  try {
    const q = `SELECT id, lesson_name FROM lesson_names ORDER BY id`;
    const r = await db.query(q);
    
    // Return as modules (same as /modules endpoint) for consistency
    const modules = r.rows.map((row, index) => formatAsModule(row, index));
    
    return res.json({ ok: true, modules });
  } catch (err) {
    console.error('Lesson fetch error:', err);
    return res.status(500).json({ ok: false, message: 'Error fetching lessons' });
  }
});

// GET /lessons/:id -> get specific lesson by ID
// NOTE: This is now redundant with /modules/:id endpoint
router.get('/lessons/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await db.query(
      `SELECT id, lesson_name FROM lesson_names WHERE id = $1`,
      [id]
    );
    
    if (!r.rows.length) {
      return res.status(404).json({ ok: false, message: 'Lesson not found' });
    }
    
    const lesson = formatAsModule(r.rows[0], id);
    
    return res.json({ ok: true, lesson });
  } catch (err) {
    console.error('Lesson fetch by id error:', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;