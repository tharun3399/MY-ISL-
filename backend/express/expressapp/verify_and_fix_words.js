// verify_and_fix_words.js
const db = require('./db');

(async () => {
  try {
    console.log('Checking current isl_words data...');
    
    // Check what's in the table
    const checkQuery = 'SELECT id, word, video_name FROM isl_words LIMIT 10;';
    const checkResult = await db.query(checkQuery);
    console.log('Current data:');
    console.table(checkResult.rows);
    
    // Update with proper Cloudflare paths
    console.log('\nUpdating with proper Cloudflare R2 paths...');
    const updateQuery = `
      UPDATE isl_words SET video_name = 
        CASE word
          WHEN 'hello' THEN 'hello.mp4'
          WHEN 'how' THEN 'how.mp4'
          WHEN 'are' THEN 'are.mp4'
          WHEN 'you' THEN 'Animated/you.mp4'
          WHEN 'thank' THEN 'First_R2/thank.mp4'
          WHEN 'please' THEN 'please.mp4'
          WHEN 'help' THEN 'help.mp4'
          WHEN 'doctor' THEN 'doctor.mp4'
          WHEN 'hospital' THEN 'hospital.mp4'
          WHEN 'emergency' THEN 'emergency.mp4'
          WHEN 'where' THEN 'where.mp4'
          WHEN 'is' THEN 'is.mp4'
          WHEN 'the' THEN 'the.mp4'
          WHEN 'need' THEN 'need.mp4'
          WHEN 'a' THEN 'a.mp4'
          WHEN 'i' THEN 'i.mp4'
          ELSE video_name
        END;
    `;
    const updateResult = await db.query(updateQuery);
    console.log('Updated rows:', updateResult.rowCount);
    
    // Verify the update
    const verifyQuery = 'SELECT id, word, video_name FROM isl_words;';
    const verifyResult = await db.query(verifyQuery);
    console.log('\nUpdated data:');
    console.table(verifyResult.rows);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
