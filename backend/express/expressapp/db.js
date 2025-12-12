// db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 3133,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'T@a3?n5#',
  database: process.env.PGDATABASE || 'demodb',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected idle client error', err);
});

module.exports = pool;
