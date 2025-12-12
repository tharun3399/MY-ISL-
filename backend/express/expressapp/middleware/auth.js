// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this';

/**
 * Middleware to verify JWT token from cookies or Authorization header
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      return res.status(401).json({ ok: false, message: 'No token provided. Please login first.' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request object
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, message: 'Token expired. Please login again.' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ ok: false, message: 'Invalid token. Please login again.' });
    }
    return res.status(401).json({ ok: false, message: 'Authentication failed.' });
  }
};

/**
 * Optional authentication - doesn't fail if no token, but sets req.user if valid
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
    next();
  } catch (err) {
    // Continue without user if token is invalid
    next();
  }
};

module.exports = {
  verifyToken,
  optionalAuth
};
