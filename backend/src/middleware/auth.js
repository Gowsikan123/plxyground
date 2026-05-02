'use strict';
const { verifyToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorised — no token provided' });
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    req.userType = payload.type;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorised — invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    if (payload.type !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden — admin only' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorised — invalid or expired token' });
  }
}

module.exports = { requireAuth, requireAdmin };
