'use strict';
const { verifyToken } = require('../utils/jwt');
const sql = require('../db/client');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing token' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    let user;
    if (payload.type === 'creator') {
      const rows = await sql`
        SELECT ca.*, c.id as creator_id, c.username, c.slug, c.display_name,
               c.bio, c.avatar_url, c.sport, c.location, c.follower_count, c.is_verified
        FROM creator_accounts ca
        JOIN creators c ON ca.creator_id = c.id
        WHERE ca.id = ${payload.sub}`;
      user = rows[0];
    } else if (payload.type === 'business') {
      const rows = await sql`SELECT * FROM businesses WHERE id = ${payload.sub}`;
      user = rows[0];
    } else if (payload.type === 'admin') {
      const rows = await sql`SELECT * FROM admin_users WHERE id = ${payload.sub}`;
      user = rows[0];
    }
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    req.user = { ...user, type: payload.type };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing token' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    if (payload.type !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    const rows = await sql`SELECT * FROM admin_users WHERE id = ${payload.sub}`;
    const admin = rows[0];
    if (!admin) return res.status(401).json({ success: false, error: 'Admin not found' });
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

module.exports = { requireAuth, requireAdmin };
