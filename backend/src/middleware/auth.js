'use strict';
const { verifyToken } = require('../utils/jwt');
const pool = require('../db/client');
const logger = require('../logger');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    const payload = verifyToken(token);
    req.userType = payload.type;
    if (payload.type === 'creator') {
      const { rows } = await pool.query(
        `SELECT ca.id, ca.creator_id, ca.is_suspended, c.username, c.slug, c.display_name, c.avatar_url, c.sport
         FROM creator_accounts ca JOIN creators c ON c.id = ca.creator_id WHERE ca.id = $1`,
        [payload.sub]
      );
      if (!rows[0]) return res.status(401).json({ error: 'Account not found.' });
      if (rows[0].is_suspended) return res.status(403).json({ error: 'Account suspended.' });
      req.user = rows[0];
    } else if (payload.type === 'business') {
      const { rows } = await pool.query('SELECT * FROM businesses WHERE id = $1', [payload.sub]);
      if (!rows[0]) return res.status(401).json({ error: 'Account not found.' });
      if (rows[0].is_suspended) return res.status(403).json({ error: 'Account suspended.' });
      req.user = rows[0];
    } else if (payload.type === 'admin') {
      const { rows } = await pool.query('SELECT * FROM admin_users WHERE id = $1', [payload.sub]);
      if (!rows[0]) return res.status(401).json({ error: 'Admin account not found.' });
      req.user = rows[0];
    } else {
      return res.status(401).json({ error: 'Invalid token type.' });
    }
    next();
  } catch (err) {
    logger.error('requireAuth middleware', { message: err.message });
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.userType !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
}

module.exports = { requireAuth, requireAdmin };
