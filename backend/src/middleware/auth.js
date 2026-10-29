'use strict';
const { verifyToken } = require('../utils/jwt');
const sql = require('../db/client');

// Loads the account a token belongs to. Throws if the token is invalid.
async function loadUser(token) {
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
  return user ? { user: { ...user, type: payload.type }, type: payload.type } : null;
}

// Suspended accounts are locked out straight away, not just at their next login.
// The one exception is deleting the account, which everyone keeps the right to do.
const requireAuth = authenticate({ allowSuspended: false });
const requireAuthEvenIfSuspended = authenticate({ allowSuspended: true });

function authenticate({ allowSuspended }) {
  return async function requireAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing token' });
    }
    let found;
    try {
      found = await loadUser(authHeader.slice(7));
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    if (!found) return res.status(401).json({ success: false, error: 'User not found' });
    if (found.user.is_suspended && !allowSuspended) {
      return res.status(403).json({ success: false, error: 'Account suspended' });
    }
    req.user = found.user;
    req.userType = found.type;
    return next();
  };
}

// Like requireAuth, but lets signed-out requests through (used to personalise public lists).
async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const found = await loadUser(authHeader.slice(7));
      if (found) {
        req.user = found.user;
        req.userType = found.type;
      }
    } catch {
      // A bad token on a public route is treated as signed out.
    }
  }
  return next();
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

module.exports = { requireAuth, requireAuthEvenIfSuspended, optionalAuth, requireAdmin };
