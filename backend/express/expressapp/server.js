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
const sentencesFetchRoute = require('./APIs/sentencesfetch');
const quizFetchRoute = require('./APIs/quizfetch');

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

// Error handling middleware for DB errors
app.use((err, req, res, next) => {
  console.error('Middleware error:', err);
  if (err.code === 'ECONNREFUSED' || err.message.includes('connect')) {
    return res.status(503).json({ error: 'Database connection failed', message: err.message });
  }
  next(err);
});

// Determine the correct path for frontend dist
// In Docker: __dirname = /app/backend/express/expressapp
// Frontend dist should be at: /app/frontend/dist
// In local dev: __dirname = c:\...\backend\express\expressapp
// Frontend dist should be at: c:\...\frontend\dist
// Calculate path by going up 3 levels from server.js location
const appRoot = path.resolve(__dirname, '../../../');
const frontendDistPath = path.join(appRoot, 'frontend', 'dist');

// Log the path for debugging
console.log('App root:', appRoot);
console.log('Serving frontend from:', frontendDistPath);
console.log('Frontend dist exists:', require('fs').existsSync(frontendDistPath));

// Serve frontend static files
app.use(express.static(frontendDistPath));

// Mount routers
// lesson routes will be available at /api/lessons
app.use('/api/lessons', lessonFetchRoute);
// topics routes will be available at /api/topics
app.use('/api/topics', topicsFetchRoute);
// sentences routes will be available at /api/sentences
app.use('/api/sentences', sentencesFetchRoute);
// quiz routes will be available at /api/quiz
app.use('/api/quiz', quizFetchRoute);
// auth routes (register/login) available at /api/auth
app.use('/api/auth', loginRegRoute);

// Video proxy endpoint to bypass CORS issues with Cloudflare R2
// MUST come before the generic /api router to avoid being caught by it
app.get('/api/video/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const r2Url = `https://pub-2d19b53b556b4755a69be5d1e59da23a.r2.dev/Animated/${filename}`;
    
    console.log(`Proxying video request: ${filename} -> ${r2Url}`);
    
    // Use native fetch (Node 18+)
    const response = await fetch(r2Url);
    
    if (!response.ok) {
      console.error(`Failed to fetch video from R2: ${response.status}`);
      return res.status(response.status).json({ error: 'Video not found' });
    }
    
    // Set proper headers for video streaming
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Stream the video response
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Error proxying video:', error);
    res.status(500).json({ error: 'Failed to load video', details: error.message });
  }
});

// user_stats route available at /api/user_stats
app.use('/api', loginRegRoute);

// Health checks
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.get('/api/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Serve frontend for all other routes (SPA fallback) - use middleware for catch-all
app.use((req, res) => {
  // Only serve index.html if it's not an API or health check
  if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    const indexPath = path.join(frontendDistPath, 'index.html');
    console.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(404).json({ error: 'Frontend not found', path: req.path });
      }
    });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});
// ---------------------------------------------------------
// START SERVER
// ---------------------------------------------------------
async function start() {
  console.log("START(): beginning startup...");

  try {
    console.log("START(): checking DB connection...");
    try {
      await db.query("SELECT 1");
      console.log("START(): DB connection SUCCESS");

      console.log("START(): running schema updates...");
      await db.query(`
        ALTER TABLE IF EXISTS "userinfo"
        ADD COLUMN IF NOT EXISTS email VARCHAR(255)
      `);
      
      // Run migrations
      const addQuizFieldsMigration = require('./migrations/add_quiz_fields');
      await addQuizFieldsMigration();
      
      console.log("START(): schema update success");
    } catch (dbErr) {
      console.warn("START(): DB CONNECTION WARNING - Server will still start but DB features may not work");
      console.warn("START(): Make sure your Render/Postgres environment variables are set:");
      console.warn("  - DATABASE_URL (preferred on Render) or PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE");
      console.warn("  - Set NODE_ENV=production on Render to enable SSL for the database connection");
      console.warn("Error:", dbErr.message);
    }

    // Create HTTP server for Socket.io
    const server = http.createServer(app);
    
    try {
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

      // Initialize socket handlers - wrap in try-catch in case modules fail
      try {
        require('./sockets/duel')(io, db);
        require('./sockets/games')(io, db);
        require('./sockets/battles')(io, db);
        require('./sockets/matchmaker')(io, db);
        console.log('All socket handlers loaded successfully');
      } catch (socketErr) {
        console.warn('Warning: Some socket handlers failed to load:', socketErr.message);
        console.warn('Socket.io will still work but some features may be unavailable');
      }

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

      server.listen(PORT, '0.0.0.0', () => {
        console.log(`SERVER RUNNING at http://0.0.0.0:${PORT}`);
        console.log(`Socket.io initialized and ready for connections`);
      });
    } catch (socketInitErr) {
      console.error('Socket.io initialization failed:', socketInitErr.message);
      console.warn('Starting server without Socket.io...');
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`SERVER RUNNING (no Socket.io) at http://0.0.0.0:${PORT}`);
      });
    }

  } catch (err) {
    console.log("START(): ERROR WHILE STARTING SERVER");
    console.error(err);
    // Exit with error code to trigger Railway restart
    process.exit(1);
  }
}

// Call start()
start();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});