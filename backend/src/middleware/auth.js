'use strict';

const { verifyToken } = require('../utils/jwt');
const { getPool } = require('../db/client');
const logger = require('../logger');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    const pool = getPool();

    if (payload.type === 'creator') {
      const { rows } = await pool.query(
        `SELECT ca.*, c.id AS creator_id, c.username, c.slug, c.display_name, c.bio, c.avatar_url, c.sport, c.location, c.follower_count, c.is_verified
         FROM creator_accounts ca
         JOIN creators c ON c.id = ca.creator_id
         WHERE ca.id = $1`,
        [payload.sub]
      );
      if (rows.length === 0) return res.status(401).json({ error: 'Account not found' });
      if (rows[0].is_suspended) return res.status(403).json({ error: 'Account is suspended' });
      req.user = rows[0];
      req.userType = 'creator';
      return next();
    }

    if (payload.type === 'business') {
      const { rows } = await pool.query(
        `SELECT * FROM businesses WHERE id = $1`,
        [payload.sub]
      );
      if (rows.length === 0) return res.status(401).json({ error: 'Account not found' });
      if (rows[0].is_suspended) return res.status(403).json({ error: 'Account is suspended' });
      req.user = rows[0];
      req.userType = 'business';
      return next();
    }

    return res.status(401).json({ error: 'Invalid token type' });
  } catch (err) {
    logger.warn('requireAuth: token verification failed', { message: err.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    if (payload.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM admins WHERE id = $1', [payload.sub]);
    if (rows.length === 0) return res.status(403).json({ error: 'Admin account not found' });
    req.admin = rows[0];
    return next();
  } catch (err) {
    logger.warn('requireAdmin: token verification failed', { message: err.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, requireAdmin };
