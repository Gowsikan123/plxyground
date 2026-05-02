'use strict';
const { verifyToken } = require('../utils/jwt');
const logger = require('../logger');

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const payload = verifyToken(token, false);
    req.user = payload;
    next();
  } catch (err) {
    logger.warn('requireAuth failed', { message: err.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const payload = verifyToken(token, true);
    req.admin = payload;
    next();
  } catch (err) {
    logger.warn('requireAdmin failed', { message: err.message });
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

function requireBusiness(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const payload = verifyToken(token, false);
    if (payload.type !== 'business') return res.status(403).json({ error: 'Business account required' });
    req.business = payload;
    next();
  } catch (err) {
    logger.warn('requireBusiness failed', { message: err.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, requireAdmin, requireBusiness };
