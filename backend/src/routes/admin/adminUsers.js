const express = require('express');
const db = require('../../db/client');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/users
router.get('/', async (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit), 1), 2000);
  const off = parseInt(offset) || 0;

  let query = `
    SELECT ca.id, ca.email, ca.is_suspended, ca.is_approved,
           ca.is_email_verified, ca.created_at,
           c.display_name as name, c.username, c.slug as profile_slug, c.location
    FROM creator_accounts ca
    JOIN creators c ON c.id = ca.creator_id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (search) {
    query += ` AND (ca.email ILIKE $${idx} OR c.display_name ILIKE $${idx+1})`;
    const s = `%${search}%`;
    params.push(s, s);
    idx += 2;
  }

  query += ` ORDER BY ca.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
  params.push(lim, off);

  const rows = await db.prepare(query).all(...params);
  res.json({ data: rows, limit: lim, offset: off });
});

// POST /api/admin/users/:userId/suspend
router.post('/:userId/suspend', async (req, res) => {
  const { reason } = req.body;
  const account = await db.prepare('SELECT * FROM creator_accounts WHERE id = $1').get(req.params.userId);
  if (!account) return res.status(404).json({ error: 'User not found' });

  await db.prepare(`UPDATE creator_accounts SET is_suspended = 1, suspension_reason = $1 WHERE id = $2`)
    .run(reason || 'Suspended by admin', req.params.userId);

  await db.prepare(`INSERT INTO audit_log (action_type, actor, target, reason) VALUES ('SUSPEND_USER', $1, $2, $3)`)
    .run(req.user.email, account.email, reason || 'Suspended by admin');

  res.json({ message: 'User suspended' });
});

// POST /api/admin/users/:userId/reactivate
router.post('/:userId/reactivate', async (req, res) => {
  const account = await db.prepare('SELECT * FROM creator_accounts WHERE id = $1').get(req.params.userId);
  if (!account) return res.status(404).json({ error: 'User not found' });

  await db.prepare(`UPDATE creator_accounts SET is_suspended = 0, suspension_reason = NULL WHERE id = $1`)
    .run(req.params.userId);

  await db.prepare(`INSERT INTO audit_log (action_type, actor, target) VALUES ('REACTIVATE_USER', $1, $2)`)
    .run(req.user.email, account.email);

  res.json({ message: 'User reactivated' });
});

// PUT /api/admin/users/:userId/role
router.put('/:userId/role', async (req, res) => {
  const { role } = req.body;
  const allowed = ['CREATOR', 'BUSINESS'];
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Role must be CREATOR or BUSINESS' });

  const account = await db.prepare('SELECT * FROM creator_accounts WHERE id = $1').get(req.params.userId);
  if (!account) return res.status(404).json({ error: 'User not found' });

  await db.prepare(`UPDATE creators SET role = $1 WHERE id = $2`).run(role, account.creator_id);

  await db.prepare(`INSERT INTO audit_log (action_type, actor, target, after_snapshot) VALUES ('CHANGE_ROLE', $1, $2, $3)`)
    .run(req.user.email, account.email, JSON.stringify({ role }));

  res.json({ message: 'Role updated' });
});

// PUT /api/admin/users/:userId/email-verify
router.put('/:userId/email-verify', async (req, res) => {
  const account = await db.prepare('SELECT * FROM creator_accounts WHERE id = $1').get(req.params.userId);
  if (!account) return res.status(404).json({ error: 'User not found' });

  await db.prepare(`UPDATE creator_accounts SET is_email_verified = 1 WHERE id = $1`).run(req.params.userId);

  res.json({ message: 'Email verified' });
});

// POST /api/admin/users/reset-password
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const account = await db.prepare('SELECT * FROM creator_accounts WHERE email = $1').get(email);
  if (!account) return res.status(404).json({ error: 'User not found' });

  console.log(`[STUB EMAIL] Password reset requested for ${email}`);

  await db.prepare(`INSERT INTO audit_log (action_type, actor, target) VALUES ('RESET_PASSWORD', $1, $2)`)
    .run(req.user.email, email);

  res.json({ message: 'Password reset email sent (stubbed in dev)' });
});

module.exports = router;
