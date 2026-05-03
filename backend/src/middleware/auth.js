'use strict';
const db = require('../db/client');
const { verifyToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const token = header.slice(7);
    const decoded = verifyToken(token);

    if (decoded.type === 'creator') {
      const account = db.prepare(`
        SELECT ca.*, c.id as creator_id, c.username, c.slug, c.display_name,
               c.bio, c.avatar_url, c.sport, c.location, c.follower_count, c.is_verified
        FROM creator_accounts ca
        JOIN creators c ON c.id = ca.creator_id
        WHERE ca.id = ?
      `).get(decoded.sub);
      if (!account) return res.status(401).json({ success: false, error: 'User not found' });
      if (account.is_suspended) return res.status(403).json({ success: false, error: 'Account suspended' });
      req.user = account;
      req.userType = 'creator';
      return next();
    }

    if (decoded.type === 'business') {
      const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(decoded.sub);
      if (!business) return res.status(401).json({ success: false, error: 'User not found' });
      if (business.is_suspended) return res.status(403).json({ success: false, error: 'Account suspended' });
      req.user = business;
      req.userType = 'business';
      return next();
    }

    return res.status(401).json({ success: false, error: 'Invalid token type' });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const token = header.slice(7);
    const decoded = verifyToken(token);
    if (decoded.type !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(decoded.sub);
    if (!admin) return res.status(401).json({ success: false, error: 'Admin not found' });
    req.admin = admin;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, requireAdmin };
