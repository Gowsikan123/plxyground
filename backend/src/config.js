'use strict';
require('dotenv').config();

const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'ADMIN_JWT_SECRET',
];

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  db: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  adminJwt: {
    secret: process.env.ADMIN_JWT_SECRET,
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  rateLimits: {
    global: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_GLOBAL || '100', 10),
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_AUTH || '10', 10),
    },
  },

  cors: {
    origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3012,http://localhost:8081')
      .split(',')
      .map((o) => o.trim()),
  },

  seed: {
    autoRun: process.env.AUTO_SEED === 'true',
  },
};
