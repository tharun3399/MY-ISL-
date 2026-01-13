const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixVideoPaths() {
  try {
    console.log('Connecting to database...');
    await db.connect();
    console.log('Connected!');

    // Update all Wan_ISL_*.mp4 to Animated/Wan_ISL_*.mp4
    // But only if they don't already have a folder prefix
    const updateQuery = `
      UPDATE isl_words
      SET video_name = 'Animated/' || video_name
      WHERE video_name LIKE 'Wan_ISL_%'
      AND video_name NOT LIKE 'Animated/%'
      AND video_name NOT LIKE 'First_R2/%'
      AND video_name NOT LIKE 'Second_R2/%'
    `;

    const result = await db.query(updateQuery);
    console.log(`\n✓ Updated ${result.rowCount} video paths to include Animated/ folder`);

    // Verify the changes
    console.log('\nVerifying first 20 entries:');
    const verifyQuery = `
      SELECT id, word, video_name 
      FROM isl_words 
      ORDER BY id ASC 
      LIMIT 20
    `;

    const verifyResult = await db.query(verifyQuery);
    console.table(verifyResult.rows);

    console.log('\n✓ Database updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixVideoPaths();
