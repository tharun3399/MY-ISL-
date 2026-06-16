// db.js
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';
const useSsl = process.env.PGSSL === 'true' || (connectionString && process.env.PGSSL !== 'false') || isProduction;

const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
const port = process.env.DB_PORT || process.env.PGPORT || '3133';
const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'T@a3?n5#';
const database = process.env.DB_NAME || process.env.PGDATABASE || 'demodb';

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    }
  : {
      host,
      port: parseInt(port, 10),
      user,
      password,
      database,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected idle client error', err);
});

module.exports = pool;
