'use strict';
const express = require('express');
const sql = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();

function creatorsOnly(req, res, next) {
  if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creators only.' });
  return next();
}

// POST /api/follows/:creatorId
router.post('/:creatorId', requireAuth, creatorsOnly, async (req, res) => {
  try {
    const followerId = req.user.creator_id;
    const followingId = parseInt(req.params.creatorId, 10);
    if (followerId === followingId) return res.status(400).json({ success: false, error: 'Cannot follow yourself.' });

    const [target] = await sql`SELECT id FROM creators WHERE id = ${followingId}`;
    if (!target) return res.status(404).json({ success: false, error: 'Creator not found.' });

    const inserted = await sql`
      INSERT INTO follows (follower_id, following_id) VALUES (${followerId}, ${followingId})
      ON CONFLICT DO NOTHING
      RETURNING follower_id`;
    if (inserted.length) {
      await sql`UPDATE creators SET follower_count = follower_count + 1 WHERE id = ${followingId}`;
    }
    return res.json({ success: true });
  } catch (err) {
    logger.error(`POST /api/follows/:creatorId: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to follow.' });
  }
});

// GET /api/follows/following
router.get('/following', requireAuth, creatorsOnly, async (req, res) => {
  try {
    const rows = await sql`
      SELECT c.id, c.username, c.slug, c.display_name, c.avatar_url, c.sport, c.is_verified
      FROM follows f JOIN creators c ON c.id = f.following_id
      WHERE f.follower_id = ${req.user.creator_id}
      ORDER BY f.created_at DESC`;
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error(`GET /api/follows/following: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch following.' });
  }
});

// GET /api/follows/followers
router.get('/followers', requireAuth, creatorsOnly, async (req, res) => {
  try {
    const rows = await sql`
      SELECT c.id, c.username, c.slug, c.display_name, c.avatar_url, c.sport, c.is_verified
      FROM follows f JOIN creators c ON c.id = f.follower_id
      WHERE f.following_id = ${req.user.creator_id}
      ORDER BY f.created_at DESC`;
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error(`GET /api/follows/followers: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch followers.' });
  }
});

// DELETE /api/follows/:creatorId
router.delete('/:creatorId', requireAuth, creatorsOnly, async (req, res) => {
  try {
    const followingId = parseInt(req.params.creatorId, 10);
    const deleted = await sql`
      DELETE FROM follows WHERE follower_id = ${req.user.creator_id} AND following_id = ${followingId}
      RETURNING follower_id`;
    if (deleted.length) {
      await sql`UPDATE creators SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = ${followingId}`;
    }
    return res.json({ success: true });
  } catch (err) {
    logger.error(`DELETE /api/follows/:creatorId: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to unfollow.' });
  }
});

module.exports = router;
