'use strict';
const { verifyToken } = require('../utils/jwt');
const pool = require('../db/client');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    if (payload.type === 'creator') {
      const result = await pool.query(
        `SELECT ca.*, c.id AS creator_id, c.username, c.slug, c.display_name, c.bio,
                c.avatar_url, c.sport, c.location, c.follower_count, c.is_verified
         FROM creator_accounts ca
         JOIN creators c ON ca.creator_id = c.id
         WHERE ca.id = $1`,
        [payload.sub]
      );
      if (!result.rows.length) return res.status(401).json({ error: 'User not found' });
      if (result.rows[0].is_suspended) return res.status(403).json({ error: 'Account suspended' });
      req.user = result.rows[0];
      req.userType = 'creator';
    } else if (payload.type === 'business') {
      const result = await pool.query(
        'SELECT * FROM businesses WHERE id = $1',
        [payload.sub]
      );
      if (!result.rows.length) return res.status(401).json({ error: 'Business not found' });
      if (result.rows[0].is_suspended) return res.status(403).json({ error: 'Account suspended' });
      req.user = result.rows[0];
      req.userType = 'business';
    } else {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    if (payload.type !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const result = await pool.query('SELECT * FROM admins WHERE id = $1', [payload.sub]);
    if (!result.rows.length) return res.status(403).json({ error: 'Admin not found' });
    req.admin = result.rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, requireAdmin };
