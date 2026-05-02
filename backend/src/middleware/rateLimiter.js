'use strict';
const rateLimit = require('express-rate-limit');

// In test environment skip rate limiting entirely so CI tests don't get 429'd
const isTest = process.env.NODE_ENV === 'test';

const noopMiddleware = (_req, _res, next) => next();

const globalLimiter = isTest
  ? noopMiddleware
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests — please try again later' },
    });

const authLimiter = isTest
  ? noopMiddleware
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many auth attempts — please try again later' },
    });

module.exports = { globalLimiter, authLimiter };
