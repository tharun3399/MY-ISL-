// APIs/loginreg.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // shared pool
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Update profile route (mounted at /api/auth/update-profile)
router.post('/update-profile', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { name, email, phone } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
    if (!validateName(name)) return res.status(400).json({ message: 'Name must be 2-100 characters' });
    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });
    if (phone && !validatePhone(phone)) return res.status(400).json({ message: 'Invalid phone number format' });

    // Only allow updating the logged-in user's info
    const userEmail = decoded.email;
    const q = `UPDATE "userinfo" SET name = $1, email = $2, phone = $3 WHERE LOWER(email) = LOWER($4) RETURNING name, email, phone`;
    const values = [name.trim(), email.toLowerCase(), phone || null, userEmail.toLowerCase()];
    const result = await db.query(q, values);
    if (!result.rows.length) return res.status(404).json({ message: 'User not found' });

    // Issue new token if email changed
    const payload = { email: result.rows[0].email, name: result.rows[0].name, phone: result.rows[0].phone };
    const newToken = createToken(payload);
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    });

    return res.json({ message: 'Profile updated successfully', user: payload });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ message: 'Server error during profile update' });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const SALT_ROUNDS = 10;

// Rate limiters (you can tune or move to server.js if preferred)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation helpers
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(pwd);
const validatePhone = (phone) => {
  if (!phone) return true;
  return /^\+?[0-9]{8,15}$/.test(phone);
};
const validateName = (name) => name && name.trim().length >= 2 && name.trim().length <= 100;
async function hashPassword(plain) { return bcrypt.hash(plain, SALT_ROUNDS); }

// Helper to create token
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Register route (mounted at /api/auth/register)
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, isGoogleAuth, googleId, googlePicture } = req.body;

    if (!name || !email || (!password && !isGoogleAuth)) {
      return res.status(400).json({ message: 'Missing required fields: name, email, password (or use Google auth)' });
    }
    if (!validateName(name)) return res.status(400).json({ message: 'Name must be 2-100 characters' });
    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });
    if (!isGoogleAuth && !validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special char' });
    }
    if (!isGoogleAuth && password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });
    if (phone && !validatePhone(phone)) return res.status(400).json({ message: 'Invalid phone number format' });

    // check existing
    const exists = await db.query('SELECT email FROM "userinfo" WHERE LOWER(email) = LOWER($1)', [email]);
    if (exists.rows.length) return res.status(409).json({ message: 'User already exists with this email' });

    const passwordHash = await hashPassword(password || googleId);

    // Ensure google columns exist
    try {
      await db.query(`
        ALTER TABLE IF EXISTS "userinfo"
        ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS is_google_auth BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
      `);
    } catch (schemaErr) {
      console.warn('Schema update warning (columns may already exist):', schemaErr.message);
    }

    // Build dynamic insert based on available columns
    let insertQ = `
      INSERT INTO "userinfo" (name, email, phone, password_hash`;
    let values = [name.trim(), email.toLowerCase(), phone || null, passwordHash];
    let paramIndex = 5;

    if (isGoogleAuth) {
      insertQ += `, google_id, is_google_auth, profile_picture`;
      values.push(googleId || null, true, googlePicture || null);
    }

    insertQ += `) VALUES ($1, $2, $3, $4`;
    if (isGoogleAuth) {
      insertQ += `, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}`;
    }
    insertQ += `) RETURNING id, name, email, phone;`;

    const result = await db.query(insertQ, values);

    return res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
  } catch (err) {
    if (err && err.code === '23505') return res.status(409).json({ message: 'User already exists with this email' });
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login route (mounted at /api/auth/login)
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, google_id, is_google_auth } = req.body;

    if (is_google_auth && google_id) {
      if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });

      try {
        // Ensure google columns exist first
        try {
          await db.query(`
            ALTER TABLE IF EXISTS "userinfo"
            ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS is_google_auth BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
          `);
        } catch (schemaErr) {
          console.warn('Schema update warning:', schemaErr.message);
        }

        // Try to select with Google columns
        const q = `
          SELECT name, email, phone, 
                 COALESCE(google_id, NULL) as google_id,
                 COALESCE(is_google_auth, false) as is_google_auth,
                 COALESCE(profile_picture, NULL) as profile_picture
          FROM "userinfo" 
          WHERE LOWER(email) = LOWER($1)
        `;
        const r = await db.query(q, [email]);
        
        if (!r.rows.length) {
          return res.status(401).json({ message: 'No account found with this Google email. Please register first.' });
        }

        const user = r.rows[0];
        if (user.is_google_auth && user.google_id !== google_id) {
          return res.status(401).json({ message: 'Google account mismatch' });
        }

        const userWithId = await db.query('SELECT id FROM "userinfo" WHERE LOWER(email) = LOWER($1)', [email]);
        const userId = userWithId.rows[0]?.id;
        const payload = { id: userId, email: user.email, name: user.name, phone: user.phone };
        const token = createToken(payload);

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 1000,
        });

        return res.json({ message: 'Logged in successfully with Google', token, user: payload });
      } catch (dbErr) {
        console.error('Google login DB error:', dbErr.message);
        // If column doesn't exist, treat as user not found
        if (dbErr.message.includes('does not exist')) {
          return res.status(401).json({ message: 'No account found with this Google email. Please register first.' });
        }
        throw dbErr;
      }
    }

    // Email/password flow
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });

    const q = 'SELECT id, name, email, phone, password_hash FROM "userinfo" WHERE LOWER(email) = LOWER($1)';
    const r = await db.query(q, [email]);
    if (!r.rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { id: user.id, email: user.email, name: user.name, phone: user.phone };
    const token = createToken(payload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    });

    return res.json({ message: 'Logged in successfully', token, user: payload });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});


// Profile route (mounted at /api/auth/profile)
router.get('/profile', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    // Fetch user info from DB - include id
    const q = 'SELECT id, name, email, phone FROM "userinfo" WHERE LOWER(email) = LOWER($1)';
    const r = await db.query(q, [decoded.email]);
    if (!r.rows.length) return res.status(404).json({ message: 'User not found' });
    const user = r.rows[0];
    return res.json({ user });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ message: 'Server error during profile fetch' });
  }
});

// Logout endpoint - Clear session cookie
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Server error during logout' });
  }
});

// Export the router
module.exports = router;
