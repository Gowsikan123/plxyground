'use strict';
const express = require('express');
const pool = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');

const router = express.Router();

router.use(requireAdmin);

router.get('/creator', async (req, res) => {
  try {
    const status = req.query.status || 'published';
    const result = await pool.query(
      `SELECT co.*, c.username, c.display_name FROM content co
       JOIN creators c ON co.creator_id=c.id
       WHERE co.status=$1 ORDER BY co.created_at DESC LIMIT 100`,
      [status]
    );
    return res.json(result.rows);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.get('/business', async (req, res) => {
  try {
    const status = req.query.status || 'published';
    const result = await pool.query(
      `SELECT bc.*, b.company_name FROM business_content bc
       JOIN businesses b ON bc.business_id=b.id
       WHERE bc.status=$1 ORDER BY bc.created_at DESC LIMIT 100`,
      [status]
    );
    return res.json(result.rows);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch business content' });
  }
});

router.delete('/creator/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query("UPDATE content SET status='deleted' WHERE id=$1", [id]);
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'DELETE_CREATOR_CONTENT', target_id: id, ip_address: req.ip });
    return res.json({ message: 'Content deleted' });
  } catch {
    return res.status(500).json({ error: 'Delete failed' });
  }
});

router.delete('/business/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query("UPDATE business_content SET status='deleted' WHERE id=$1", [id]);
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'DELETE_BUSINESS_CONTENT', target_id: id, ip_address: req.ip });
    return res.json({ message: 'Content deleted' });
  } catch {
    return res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
