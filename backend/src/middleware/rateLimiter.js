'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter: 100 requests per 15 minutes per IP.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

/**
 * Auth rate limiter: 10 requests per 15 minutes per IP.
 * Applied to /api/auth/* and /api/business/auth/* and /api/admin/auth/*
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

module.exports = { globalLimiter, authLimiter };
