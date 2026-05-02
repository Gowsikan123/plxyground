'use strict';
const { verifyToken } = require('../utils/jwt');
const pool = require('../db/client');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (payload.type === 'creator') {
      const { rows } = await pool.query(
        `SELECT ca.id, ca.creator_id, ca.email, ca.role, ca.is_suspended,
                c.username, c.slug, c.display_name, c.sport, c.avatar_url, c.location, c.bio
         FROM creator_accounts ca
         JOIN creators c ON c.id = ca.creator_id
         WHERE ca.id = $1`,
        [payload.sub]
      );
      if (!rows[0]) return res.status(401).json({ error: 'User not found.' });
      if (rows[0].is_suspended) return res.status(403).json({ error: 'Account suspended.' });
      req.user = rows[0];
      req.userType = 'creator';
    } else if (payload.type === 'business') {
      const { rows } = await pool.query(
        `SELECT id, email, company_name, slug, industry, logo_url, location, bio, is_suspended
         FROM businesses WHERE id = $1`,
        [payload.sub]
      );
      if (!rows[0]) return res.status(401).json({ error: 'Business not found.' });
      if (rows[0].is_suspended) return res.status(403).json({ error: 'Account suspended.' });
      req.user = rows[0];
      req.userType = 'business';
    } else {
      return res.status(401).json({ error: 'Invalid token type.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const { rows } = await pool.query('SELECT id, email FROM admins WHERE id = $1', [payload.sub]);
    if (!rows[0]) return res.status(403).json({ error: 'Admin not found.' });
    req.admin = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth, requireAdmin };
