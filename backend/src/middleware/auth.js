'use strict';

const { verifyToken } = require('../utils/jwt');
const pool = require('../db/client');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorisation token required' });
    }
    const token = header.slice(7);
    const payload = verifyToken(token);
    req.actor = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorisation token required' });
    }
    const token = header.slice(7);
    const payload = verifyToken(token);
    if (payload.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { rows } = await pool.query('SELECT id, email FROM admins WHERE id = $1', [payload.id]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Admin account not found' });
    }
    req.admin = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, requireAdmin };
