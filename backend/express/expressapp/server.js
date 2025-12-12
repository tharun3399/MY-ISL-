// server.js
console.log('SERVER: starting server.js');

require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const db = require('./db'); // shared pool (expressapp/db.js)
const lessonFetchRoute = require('./APIs/lesssonfetch');
const loginRegRoute = require('./APIs/loginreg');
const topicsFetchRoute = require('./APIs/topicsfetch');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const FRONTEND = process.env.FRONTEND_ORIGIN || 'http://localhost:5174';

console.log('SERVER: config', { PORT, FRONTEND });

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      FRONTEND
    ];
    // if no origin (e.g. curl, server-to-server) allow it
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Mount routers
// lesson routes will be available at /api/lessons
app.use('/api/lessons', lessonFetchRoute);
// topics routes will be available at /api/topics
app.use('/api/topics', topicsFetchRoute);
// auth routes (register/login) available at /api/auth
app.use('/api/auth', loginRegRoute);

// simple health check
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// optional: serve frontend build (uncomment and set correct folder)
// app.use(express.sta
// ---------------------------------------------------------
// START SERVER
// ---------------------------------------------------------
async function start() {
  console.log("START(): beginning startup...");

  try {
    console.log("START(): checking DB connection...");
    await db.query("SELECT 1");
    console.log("START(): DB connection SUCCESS");

    console.log("START(): running schema updates...");
    await db.query(`
      ALTER TABLE IF EXISTS "userinfo"
      ADD COLUMN IF NOT EXISTS email VARCHAR(255)
    `);
    console.log("START(): schema update success");

    app.listen(PORT, () => {
      console.log(`SERVER RUNNING at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.log("START(): ERROR WHILE STARTING SERVER");
    console.error(err);
  }
}

// Call start()
start();