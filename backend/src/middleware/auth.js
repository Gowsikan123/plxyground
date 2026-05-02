'use strict';

const { verifyToken } = require('../utils/jwt');
const { getPool } = require('../db/client');
const logger = require('../logger');

function extractToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { payload, error } = verifyToken(token, 'creator');
  if (error) return res.status(401).json({ error: 'Invalid or expired token' });

  try {
    const pool = getPool();
    let user = null;

    if (payload.type === 'business') {
      const { rows } = await pool.query(
        'SELECT id, email, company_name, is_suspended FROM businesses WHERE id = $1',
        [payload.id],
      );
      user = rows[0];
    } else {
      const { rows } = await pool.query(
        'SELECT id, email, username, is_suspended FROM creators WHERE id = $1',
        [payload.id],
      );
      user = rows[0];
    }

    if (!user) return res.status(401).json({ error: 'Account not found' });
    if (user.is_suspended) return res.status(403).json({ error: 'Account suspended' });

    req.user = { ...user, type: payload.type };
    next();
  } catch (err) {
    logger.error('requireAuth db error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { payload, error } = verifyToken(token, 'admin');
  if (error) return res.status(401).json({ error: 'Invalid or expired admin token' });

  try {
    const { rows } = await getPool().query(
      'SELECT id, username, role, is_active FROM admins WHERE id = $1',
      [payload.id],
    );
    const admin = rows[0];
    if (!admin) return res.status(401).json({ error: 'Admin not found' });
    if (!admin.is_active) return res.status(403).json({ error: 'Admin account disabled' });

    req.admin = admin;
    next();
  } catch (err) {
    logger.error('requireAdmin db error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { requireAuth, requireAdmin, requireRole };
