// server.js
console.log('SERVER: starting server.js');

require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIO = require('socket.io');

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

    // Create HTTP server for Socket.io
    const server = http.createServer(app);
    
    // Initialize Socket.io with CORS
    const io = socketIO(server, {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:3000',
          FRONTEND
        ],
        credentials: true,
        methods: ['GET', 'POST']
      }
    });

    // Socket.io middleware for authentication
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          socket.userId = decoded.id || decoded.userId;
          socket.user = decoded;
          console.log(`Socket authenticated for user ${socket.userId}`);
          next();
        } catch (err) {
          console.log('Socket auth error:', err.message);
          // Allow connection but mark as unauthenticated
          socket.userId = null;
          socket.user = null;
          next();
        }
      } else {
        // Allow connection without token but mark as unauthenticated
        socket.userId = null;
        socket.user = null;
        next();
      }
    });

    // Initialize socket handlers
    require('./sockets/duel')(io, db);
    require('./sockets/games')(io, db);
    require('./sockets/battles')(io, db);
    require('./sockets/matchmaker')(io, db);

    // Handle socket connections
    io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected with socket ID ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
      });

      socket.on('error', (error) => {
        console.log(`Socket error for user ${socket.userId}:`, error);
      });
    });

    server.listen(PORT, () => {
      console.log(`SERVER RUNNING at http://localhost:${PORT}`);
      console.log(`Socket.io initialized and ready for connections`);
    });

  } catch (err) {
    console.log("START(): ERROR WHILE STARTING SERVER");
    console.error(err);
  }
}

// Call start()
start();