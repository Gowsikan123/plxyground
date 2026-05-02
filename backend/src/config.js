'use strict';
require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`[config] Missing required environment variable: ${key}`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('[config] JWT_SECRET must be at least 32 characters long.');
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3011,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:19006', 'http://localhost:3012'],
  nodeEnv: process.env.NODE_ENV || 'development',
};
