'use strict';
require('dotenv').config();

const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`[config] Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  db: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  cors: {
    origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3012')
      .split(',')
      .map((o) => o.trim()),
  },

  rateLimit: {
    globalWindowMs: 15 * 60 * 1000,
    globalMax: parseInt(process.env.RATE_LIMIT_GLOBAL || '100', 10),
    authWindowMs: 15 * 60 * 1000,
    authMax: parseInt(process.env.RATE_LIMIT_AUTH || '10', 10),
  },

  adminPanel: {
    port: parseInt(process.env.ADMIN_PORT || '3012', 10),
  },
};
