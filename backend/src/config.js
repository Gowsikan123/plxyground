'use strict';

require('dotenv').config();

const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_JWT_SECRET',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`[config] Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET,
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '4h',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50', 10),
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(','),
};
