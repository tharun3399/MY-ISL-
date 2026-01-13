// check_isl_words_schema.js
const db = require('./db');

(async () => {
  try {
    // Check table structure
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'isl_words';
    `;
    const result = await db.query(query);
    console.log('isl_words table columns:');
    console.table(result.rows);
    
    // Also check if table exists
    if (result.rows.length === 0) {
      console.log('Table isl_words does not exist or has no columns');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
