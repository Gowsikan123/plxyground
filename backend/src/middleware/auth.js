'use strict';
const db = require('../db/client');
const { verifyToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  const token = header.slice(7);
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  if (payload.type === 'creator') {
    const account = db
      .prepare(
        `SELECT ca.*, c.id as creator_id, c.username, c.slug, c.display_name,
         c.bio, c.avatar_url, c.sport, c.location, c.follower_count, c.is_verified
         FROM creator_accounts ca JOIN creators c ON ca.creator_id = c.id
         WHERE ca.id = ?`
      )
      .get(payload.sub);
    if (!account) return res.status(401).json({ success: false, error: 'User not found' });
    if (account.is_suspended) return res.status(403).json({ success: false, error: 'Account suspended' });
    req.user = account;
    req.userType = 'creator';
    return next();
  }

  if (payload.type === 'business') {
    const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(payload.sub);
    if (!biz) return res.status(401).json({ success: false, error: 'Business not found' });
    if (biz.is_suspended) return res.status(403).json({ success: false, error: 'Account suspended' });
    req.user = biz;
    req.userType = 'business';
    return next();
  }

  return res.status(401).json({ success: false, error: 'Invalid token type' });
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  const token = header.slice(7);
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
  if (payload.type !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(payload.sub);
  if (!admin) return res.status(403).json({ success: false, error: 'Admin not found' });
  req.admin = admin;
  return next();
}

module.exports = { requireAuth, requireAdmin };
