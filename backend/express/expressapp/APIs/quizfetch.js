// APIs/quizfetch.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Seeded random number generator for reproducible randomization
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Fisher-Yates shuffle using seeded random
function shuffleArray(array, seed) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Hash function to create seed from user + topic
function createSeed(userId, topicId) {
  const hash = crypto.createHash('md5').update(`${userId}-${topicId}-quiz`).digest('hex');
  return parseInt(hash.substring(0, 8), 16);
}

// Generate MCQ questions from sentences
async function generateQuizQuestions(topicId, userId, questionCount = 10) {
  try {
    const seed = createSeed(userId, topicId);

    // Get sentences for this topic
    const topicSentencesResult = await db.query(
      `SELECT s.id, s.sentence 
       FROM sentences s 
       WHERE s.topic_id = $1 
       ORDER BY s.id`,
      [topicId]
    );

    if (topicSentencesResult.rows.length === 0) {
      return [];
    }

    const topicSentences = topicSentencesResult.rows;

    // Get all sentences from the same lesson for distractors
    const lessonResult = await db.query(
      `SELECT lesson_id FROM topics WHERE id = $1`,
      [topicId]
    );

    if (!lessonResult.rows.length) {
      return [];
    }

    const lessonId = lessonResult.rows[0].lesson_id;

    const allSentencesResult = await db.query(
      `SELECT s.id, s.sentence, t.id as topic_id
       FROM sentences s 
       JOIN topics t ON s.topic_id = t.id 
       WHERE t.lesson_id = $1 
       ORDER BY s.id`,
      [lessonId]
    );

    const allSentences = allSentencesResult.rows;

    // Generate questions
    const questions = [];
    const questionsToGenerate = Math.min(questionCount, topicSentences.length * 2); // Generate variety

    for (let i = 0; i < questionsToGenerate; i++) {
      const correctSentenceIndex = Math.floor(seededRandom(seed + i * 100) * topicSentences.length);
      const correctSentence = topicSentences[correctSentenceIndex];

      // Get 3 distractors from other sentences
      let distractors = allSentences.filter(s => s.id !== correctSentence.id);
      
      if (distractors.length < 3) {
        // If not enough distractors, use what we have
        distractors = shuffleArray(distractors, seed + i * 50).slice(0, Math.min(3, distractors.length));
      } else {
        // Select 3 random distractors using seed
        const indices = [];
        for (let j = 0; j < 3; j++) {
          const idx = Math.floor(seededRandom(seed + i * 50 + j * 10) * distractors.length);
          if (!indices.includes(idx)) {
            indices.push(idx);
          }
        }
        distractors = indices.map(idx => distractors[idx]);
      }

      // Create options with correct answer
      const options = shuffleArray([correctSentence, ...distractors], seed + i * 200);
      const correctIndex = options.findIndex(opt => opt.id === correctSentence.id);

      questions.push({
        id: `q_${topicId}_${i}`,
        type: 'mcq',
        question: `What does this gesture mean?`,
        sentenceId: correctSentence.id,
        options: options.map(opt => ({
          id: opt.id,
          text: opt.sentence
        })),
        correctAnswer: correctIndex // Index of correct option
      });
    }

    // Return only the requested number
    return questions.slice(0, questionCount);
  } catch (err) {
    console.error('Error generating quiz questions:', err);
    throw err;
  }
}

// GET /api/quiz/generate/:topicId -> Generate quiz questions for a topic
router.get('/generate/:topicId', verifyToken, async (req, res) => {
  try {
    const { topicId } = req.params;
    const questionCount = parseInt(req.query.count) || 10;

    // Get user ID from token
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-this');
    
    const userResult = await db.query(
      `SELECT id FROM "userinfo" WHERE LOWER(email) = LOWER($1)`,
      [decoded.email]
    );

    if (!userResult.rows.length) {
      return res.status(401).json({ ok: false, message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Generate questions
    const questions = await generateQuizQuestions(topicId, userId, questionCount);

    return res.json({
      ok: true,
      topicId,
      userId,
      questionCount: questions.length,
      questions: questions.map(q => ({
        ...q,
        correctAnswer: undefined // Don't send correct answer to frontend
      }))
    });
  } catch (err) {
    console.error('Quiz generation error:', err);
    return res.status(500).json({ ok: false, message: 'Error generating quiz' });
  }
});

// POST /api/quiz/submit -> Submit quiz answers
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const { topicId, answers } = req.body;

    if (!topicId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ ok: false, message: 'Invalid quiz submission' });
    }

    // Get user ID from token
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-this');
    
    const userResult = await db.query(
      `SELECT id FROM "userinfo" WHERE LOWER(email) = LOWER($1)`,
      [decoded.email]
    );

    if (!userResult.rows.length) {
      return res.status(401).json({ ok: false, message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Regenerate questions to validate answers
    const questions = await generateQuizQuestions(topicId, userId, answers.length);

    // Calculate score
    let correctCount = 0;
    const results = answers.map((answer, idx) => {
      const question = questions[idx];
      const isCorrect = question && question.correctAnswer === answer;
      if (isCorrect) correctCount++;
      return {
        questionId: idx,
        isCorrect,
        userAnswer: answer,
        correctAnswer: question?.correctAnswer
      };
    });

    const score = Math.round((correctCount / answers.length) * 100);
    const passed = score >= 70; // 70% pass threshold

    // Update user_topic_progress with quiz score
    await db.query(
      `UPDATE user_topic_progress 
       SET quiz_score = $1, quiz_completed = true, quiz_passed = $2
       WHERE user_id = $3 AND topic_id = $4`,
      [score, passed, userId, topicId]
    );

    return res.json({
      ok: true,
      score,
      passed,
      correctCount,
      totalCount: answers.length,
      results
    });
  } catch (err) {
    console.error('Quiz submission error:', err);
    return res.status(500).json({ ok: false, message: 'Error submitting quiz' });
  }
});

// GET /api/quiz/status/:topicId -> Get quiz status for a topic
router.get('/status/:topicId', verifyToken, async (req, res) => {
  try {
    const { topicId } = req.params;

    // Get user ID from token
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-this');
    
    const userResult = await db.query(
      `SELECT id FROM "userinfo" WHERE LOWER(email) = LOWER($1)`,
      [decoded.email]
    );

    if (!userResult.rows.length) {
      return res.status(401).json({ ok: false, message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Get quiz status
    const result = await db.query(
      `SELECT quiz_completed, quiz_score, quiz_passed 
       FROM user_topic_progress 
       WHERE user_id = $1 AND topic_id = $2`,
      [userId, topicId]
    );

    const status = result.rows[0] || {
      quiz_completed: false,
      quiz_score: null,
      quiz_passed: false
    };

    return res.json({
      ok: true,
      topicId,
      completed: status.quiz_completed,
      score: status.quiz_score,
      passed: status.quiz_passed
    });
  } catch (err) {
    console.error('Quiz status error:', err);
    return res.status(500).json({ ok: false, message: 'Error fetching quiz status' });
  }
});

module.exports = router;
