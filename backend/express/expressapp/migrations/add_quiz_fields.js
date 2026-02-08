// migrations/add_quiz_fields.js
// This migration adds quiz fields to the user_topic_progress table

const db = require('../db');

async function runMigration() {
  try {
    console.log('Starting migration: add_quiz_fields');

    // Check if quiz_score column exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='user_topic_progress' AND column_name='quiz_score'
    `;

    const result = await db.query(checkQuery);

    if (result.rows.length > 0) {
      console.log('Migration already applied: quiz fields already exist');
      return;
    }

    // Add quiz columns
    const alterQuery = `
      ALTER TABLE user_topic_progress 
      ADD COLUMN quiz_score INTEGER DEFAULT NULL,
      ADD COLUMN quiz_completed BOOLEAN DEFAULT false,
      ADD COLUMN quiz_passed BOOLEAN DEFAULT false,
      ADD COLUMN quiz_attempts INTEGER DEFAULT 0
    `;

    await db.query(alterQuery);
    console.log('✓ Successfully added quiz fields to user_topic_progress table');
    console.log('  - quiz_score: INTEGER (NULL if not attempted)');
    console.log('  - quiz_completed: BOOLEAN (false by default)');
    console.log('  - quiz_passed: BOOLEAN (false by default)');
    console.log('  - quiz_attempts: INTEGER (track number of attempts)');

  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('Migration already applied: columns already exist');
    } else {
      console.error('Migration failed:', err.message);
      throw err;
    }
  }
}

module.exports = runMigration;
