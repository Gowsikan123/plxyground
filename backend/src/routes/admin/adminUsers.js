const express = require('express');
const pool = require('../../db/client');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/users  — unified list: creators + businesses merged
router.get('/', async (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit) || 50, 1), 2000);
  const off = parseInt(offset) || 0;

  try {
    const s = search ? `%${search}%` : null;
    const params = [];
    let idx = 1;

    let creatorsQ = `
      SELECT ca.id, ca.email, ca.is_suspended, ca.is_approved,
             ca.is_email_verified, ca.created_at,
             c.display_name AS name, c.username, c.slug AS profile_slug,
             c.location, 'creator' AS role
      FROM creator_accounts ca
      JOIN creators c ON c.id = ca.creator_id
      WHERE 1=1
    `;
    if (s) {
      creatorsQ += ` AND (ca.email ILIKE $${idx} OR c.display_name ILIKE $${idx + 1})`;
      params.push(s, s);
      idx += 2;
    }

    let businessQ = `
      SELECT ba.id, ba.email, ba.is_suspended,
             TRUE AS is_approved, ba.is_email_verified, ba.created_at,
             b.name, b.slug AS username, b.slug AS profile_slug,
             b.location, 'business' AS role
      FROM business_accounts ba
      JOIN businesses b ON b.id = ba.business_id
      WHERE 1=1
    `;
    if (s) {
      businessQ += ` AND (ba.email ILIKE $${idx} OR b.name ILIKE $${idx + 1})`;
      params.push(s, s);
      idx += 2;
    }

    const unionQ = `
      SELECT * FROM (
        ${creatorsQ}
        UNION ALL
        ${businessQ}
      ) AS combined
      ORDER BY created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    params.push(lim, off);

    const { rows } = await pool.query(unionQ, params);
    res.json({ data: rows, limit: lim, offset: off });
  } catch (err) {
    console.error('Users list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/:userId/suspend
router.post('/:userId/suspend', async (req, res) => {
  const { reason, userType = 'creator' } = req.body;
  const { userId } = req.params;

  try {
    const table = userType === 'business' ? 'business_accounts' : 'creator_accounts';
    const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [userId]);
    const account = rows[0];
    if (!account) return res.status(404).json({ error: 'User not found' });

    await pool.query(
      `UPDATE ${table} SET is_suspended = TRUE, suspension_reason = $1 WHERE id = $2`,
      [reason || 'Suspended by admin', userId]
    );

    await pool.query(
      `INSERT INTO audit_log (action_type, actor, target, reason) VALUES ('SUSPEND_USER', $1, $2, $3)`,
      [req.user.email, account.email, reason || 'Suspended by admin']
    );

    res.json({ message: 'User suspended' });
  } catch (err) {
    console.error('Suspend error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/:userId/reactivate
router.post('/:userId/reactivate', async (req, res) => {
  const { userType = 'creator' } = req.body;
  const { userId } = req.params;

  try {
    const table = userType === 'business' ? 'business_accounts' : 'creator_accounts';
    const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [userId]);
    const account = rows[0];
    if (!account) return res.status(404).json({ error: 'User not found' });

    await pool.query(
      `UPDATE ${table} SET is_suspended = FALSE, suspension_reason = NULL WHERE id = $1`,
      [userId]
    );

    await pool.query(
      `INSERT INTO audit_log (action_type, actor, target) VALUES ('REACTIVATE_USER', $1, $2)`,
      [req.user.email, account.email]
    );

    res.json({ message: 'User reactivated' });
  } catch (err) {
    console.error('Reactivate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:userId/role
router.put('/:userId/role', async (req, res) => {
  const { role } = req.body;
  const allowed = ['CREATOR', 'BUSINESS'];
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Role must be CREATOR or BUSINESS' });

  try {
    const { rows } = await pool.query('SELECT * FROM creator_accounts WHERE id = $1', [req.params.userId]);
    const account = rows[0];
    if (!account) return res.status(404).json({ error: 'User not found' });

    await pool.query('UPDATE creators SET role = $1 WHERE id = $2', [role, account.creator_id]);

    await pool.query(
      `INSERT INTO audit_log (action_type, actor, target, after_snapshot) VALUES ('CHANGE_ROLE', $1, $2, $3)`,
      [req.user.email, account.email, JSON.stringify({ role })]
    );

    res.json({ message: 'Role updated' });
  } catch (err) {
    console.error('Role update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:userId/email-verify
router.put('/:userId/email-verify', async (req, res) => {
  const { userType = 'creator' } = req.body;
  const { userId } = req.params;

  try {
    const table = userType === 'business' ? 'business_accounts' : 'creator_accounts';
    const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });

    await pool.query(`UPDATE ${table} SET is_email_verified = TRUE WHERE id = $1`, [userId]);
    res.json({ message: 'Email verified' });
  } catch (err) {
    console.error('Email verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/reset-password
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const { rows: creatorRows } = await pool.query('SELECT * FROM creator_accounts WHERE email = $1', [email]);
    const { rows: bizRows } = await pool.query('SELECT * FROM business_accounts WHERE email = $1', [email]);
    const account = creatorRows[0] || bizRows[0];
    if (!account) return res.status(404).json({ error: 'User not found' });

    // TODO: send real email via SendGrid/Resend in production
    process.stdout.write(`[STUB EMAIL] Password reset requested for ${email}\n`);

    await pool.query(
      `INSERT INTO audit_log (action_type, actor, target) VALUES ('RESET_PASSWORD', $1, $2)`,
      [req.user.email, email]
    );

    res.json({ message: 'Password reset email sent (stubbed in dev)' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
