'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const db = require('../db/client');
const logger = require('../logger');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (payload.type === 'business') {
      const { rows } = await db.query(
        'SELECT id, email, company_name, is_suspended FROM businesses WHERE id = $1',
        [payload.sub]
      );
      if (!rows.length) return res.status(401).json({ error: 'Account not found' });
      if (rows[0].is_suspended) return res.status(403).json({ error: 'Account suspended' });
      req.business = rows[0];
      req.actorType = 'business';
    } else {
      const { rows } = await db.query(
        'SELECT id, username, email, role, is_suspended FROM users WHERE id = $1',
        [payload.sub]
      );
      if (!rows.length) return res.status(401).json({ error: 'Account not found' });
      if (rows[0].is_suspended) return res.status(403).json({ error: 'Account suspended' });
      req.user = rows[0];
      req.actorType = rows[0].role;
    }

    next();
  } catch (err) {
    logger.error('requireAuth error', { message: err.message });
    res.status(500).json({ error: 'Authentication error' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireBusiness(req, res, next) {
  if (!req.business) {
    return res.status(403).json({ error: 'Business account required' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireBusiness };
