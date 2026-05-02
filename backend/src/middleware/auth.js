'use strict';
const { verifyToken } = require('../utils/jwt');

function requireAuth(role) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    }
    const token = header.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    if (role && payload.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    req.user = payload;
    next();
  };
}

module.exports = { requireAuth };
