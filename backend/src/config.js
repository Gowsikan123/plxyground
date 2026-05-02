'use strict';

const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    throw new Error(`[config] Missing required environment variable: ${key}`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('[config] JWT_SECRET must be at least 32 characters');
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3011,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:19006', 'http://localhost:3012'],
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
};

module.exports = config;
