'use strict';

const { verifyToken } = require('../utils/jwt');
const pool = require('../db/client');
const logger = require('../logger');

/**
 * Middleware: requires a valid creator or business JWT.
 * Attaches decoded payload to req.user.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = header.slice(7);
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    logger.warn('requireAuth failed', { message: err.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: requires a valid admin JWT.
 * Must be used after requireAuth or standalone with the same token shape.
 */
async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = header.slice(7);
    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.admin = payload;
    next();
  } catch (err) {
    logger.warn('requireAdmin failed', { message: err.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, requireAdmin };
