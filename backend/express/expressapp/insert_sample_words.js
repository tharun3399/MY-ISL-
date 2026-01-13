// insert_sample_words.js
const db = require('./db');

(async () => {
  try {
    const query = `
      INSERT INTO isl_words (word, video_name) VALUES
      ('i', 'hello.mp4'),
      ('need', 'need.mp4'),
      ('a', 'a.mp4'),
      ('doctor', 'doctor.mp4'),
      ('where', 'where.mp4'),
      ('is', 'is.mp4'),
      ('the', 'the.mp4'),
      ('hospital', 'hospital.mp4'),
      ('hello', 'hello.mp4'),
      ('how', 'how.mp4'),
      ('are', 'are.mp4'),
      ('you', 'you.mp4'),
      ('thank', 'thank.mp4'),
      ('please', 'please.mp4'),
      ('help', 'help.mp4'),
      ('emergency', 'emergency.mp4')
      ON CONFLICT (word) DO NOTHING;
    `;
    const result = await db.query(query);
    console.log('Sample data inserted successfully');
    console.log('Rows affected:', result.rowCount);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
