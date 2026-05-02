'use strict';
const { verifyToken } = require('../utils/jwt');
const pool = require('../db/client');
const logger = require('../logger');

async function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.userType = payload.type;
    if (payload.type === 'creator') {
      const { rows } = await pool.query(
        `SELECT ca.*, c.id AS creator_id, c.username, c.slug, c.display_name, c.bio, c.avatar_url, c.sport, c.location, c.follower_count, c.is_verified
         FROM creator_accounts ca JOIN creators c ON c.id = ca.creator_id
         WHERE ca.id = $1`,
        [payload.sub]
      );
      if (!rows[0]) return res.status(401).json({ error: 'User not found.' });
      if (rows[0].is_suspended) return res.status(403).json({ error: 'Account suspended.' });
      req.user = rows[0];
    } else if (payload.type === 'business') {
      const { rows } = await pool.query('SELECT * FROM businesses WHERE id = $1', [payload.sub]);
      if (!rows[0]) return res.status(401).json({ error: 'Business not found.' });
      if (rows[0].is_suspended) return res.status(403).json({ error: 'Account suspended.' });
      req.user = rows[0];
    } else {
      return res.status(401).json({ error: 'Invalid token type.' });
    }
    next();
  } catch (err) {
    logger.warn('requireAuth failed', { message: err.message });
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

async function requireAdmin(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    if (payload.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const { rows } = await pool.query('SELECT * FROM admins WHERE id = $1', [payload.sub]);
    if (!rows[0]) return res.status(403).json({ error: 'Admin not found.' });
    req.admin = rows[0];
    next();
  } catch (err) {
    logger.warn('requireAdmin failed', { message: err.message });
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth, requireAdmin };
