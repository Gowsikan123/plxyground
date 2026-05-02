'use strict';
const express = require('express');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();

router.post('/:creatorId', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creators only.' });
  try {
    const followerId = req.user.creator_id;
    const followingId = parseInt(req.params.creatorId, 10);
    if (followerId === followingId) return res.status(400).json({ error: 'Cannot follow yourself.' });
    await pool.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [followerId, followingId]
    );
    await pool.query('UPDATE creators SET follower_count = follower_count + 1 WHERE id = $1', [followingId]);
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/follows/:creatorId', { message: err.message });
    return res.status(500).json({ error: 'Failed to follow.' });
  }
});

router.delete('/:creatorId', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creators only.' });
  try {
    const followerId = req.user.creator_id;
    const followingId = parseInt(req.params.creatorId, 10);
    const { rowCount } = await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
    if (rowCount > 0) {
      await pool.query('UPDATE creators SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = $1', [followingId]);
    }
    return res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /api/follows/:creatorId', { message: err.message });
    return res.status(500).json({ error: 'Failed to unfollow.' });
  }
});

router.get('/following', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creators only.' });
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.username, c.slug, c.display_name, c.avatar_url, c.sport, c.is_verified
       FROM follows f JOIN creators c ON c.id = f.following_id WHERE f.follower_id = $1 ORDER BY f.created_at DESC`,
      [req.user.creator_id]
    );
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/follows/following', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch following.' });
  }
});

router.get('/followers', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creators only.' });
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.username, c.slug, c.display_name, c.avatar_url, c.sport, c.is_verified
       FROM follows f JOIN creators c ON c.id = f.follower_id WHERE f.following_id = $1 ORDER BY f.created_at DESC`,
      [req.user.creator_id]
    );
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/follows/followers', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch followers.' });
  }
});

module.exports = router;
