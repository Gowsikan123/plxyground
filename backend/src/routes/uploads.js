'use strict';
const crypto = require('crypto');
const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');
const logger = require('../logger');

const router = express.Router();

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 3 * 1024 * 1024; // keeps the request under Vercel's 4.5 MB body limit once base64-encoded

// POST /api/uploads  { data: <base64>, content_type: 'image/jpeg' | 'image/png' | 'image/webp' }
// Stores the image in Vercel Blob and returns its public URL. The app resizes
// photos before sending, so typical uploads are a few hundred KB.
router.post(
  '/',
  requireAuth,
  [
    body('data').isString().notEmpty().withMessage('Image data required'),
    body('content_type').isIn(Object.keys(TYPES)).withMessage('Only JPEG, PNG or WebP images'),
  ],
  validationErrorHandler,
  async (req, res) => {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({ success: false, error: 'Photo uploads are not set up on this server yet.' });
    }
    try {
      const buffer = Buffer.from(req.body.data, 'base64');
      if (!buffer.length) return res.status(400).json({ success: false, error: 'Image data is empty' });
      if (buffer.length > MAX_BYTES) return res.status(413).json({ success: false, error: 'Image is too large (max 3 MB)' });

      const { put } = require('@vercel/blob');
      const owner = req.userType === 'creator' ? `creator-${req.user.creator_id}` : `business-${req.user.id}`;
      const name = `uploads/${owner}/${crypto.randomUUID()}.${TYPES[req.body.content_type]}`;
      const blob = await put(name, buffer, { access: 'public', contentType: req.body.content_type });
      return res.status(201).json({ success: true, data: { url: blob.url } });
    } catch (err) {
      logger.error(`POST /api/uploads: ${err.message}`);
      return res.status(500).json({ success: false, error: 'Upload failed. Try again.' });
    }
  }
);

module.exports = router;
