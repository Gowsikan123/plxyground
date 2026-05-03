'use strict';
const express = require('express');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();

// POST /api/follows/:creatorId
router.post('/:creatorId', requireAuth, (req, res) => {
  if (req.userType !== 'creator')
    return res.status(403).json({ success: false, error: 'Creators only.' });
  try {
    const followerId = req.user.creator_id;
    const followingId = parseInt(req.params.creatorId, 10);
    if (followerId === followingId)
      return res.status(400).json({ success: false, error: 'Cannot follow yourself.' });

    const existing = db
      .prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?')
      .get(followerId, followingId);
    if (!existing) {
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(followerId, followingId);
      db.prepare('UPDATE creators SET follower_count = follower_count + 1 WHERE id = ?').run(followingId);
    }
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/follows/:creatorId', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to follow.' });
  }
});

// DELETE /api/follows/:creatorId
router.delete('/:creatorId', requireAuth, (req, res) => {
  if (req.userType !== 'creator')
    return res.status(403).json({ success: false, error: 'Creators only.' });
  try {
    const followerId = req.user.creator_id;
    const followingId = parseInt(req.params.creatorId, 10);
    const result = db
      .prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?')
      .run(followerId, followingId);
    if (result.changes > 0) {
      db.prepare('UPDATE creators SET follower_count = MAX(follower_count - 1, 0) WHERE id = ?').run(followingId);
    }
    return res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /api/follows/:creatorId', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to unfollow.' });
  }
});

// GET /api/follows/following
router.get('/following', requireAuth, (req, res) => {
  if (req.userType !== 'creator')
    return res.status(403).json({ success: false, error: 'Creators only.' });
  try {
    const rows = db
      .prepare(
        `SELECT c.id, c.username, c.slug, c.display_name, c.avatar_url, c.sport, c.is_verified
         FROM follows f JOIN creators c ON c.id = f.following_id
         WHERE f.follower_id = ?
         ORDER BY f.created_at DESC`
      )
      .all(req.user.creator_id);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('GET /api/follows/following', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch following.' });
  }
});

// GET /api/follows/followers
router.get('/followers', requireAuth, (req, res) => {
  if (req.userType !== 'creator')
    return res.status(403).json({ success: false, error: 'Creators only.' });
  try {
    const rows = db
      .prepare(
        `SELECT c.id, c.username, c.slug, c.display_name, c.avatar_url, c.sport, c.is_verified
         FROM follows f JOIN creators c ON c.id = f.follower_id
         WHERE f.following_id = ?
         ORDER BY f.created_at DESC`
      )
      .all(req.user.creator_id);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('GET /api/follows/followers', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch followers.' });
  }
});

module.exports = router;
