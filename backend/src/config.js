'use strict';
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '3011', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  
  // JWT config
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:19006,http://localhost:3012').split(',').map(s => s.trim()),
  
  // Database
  databaseUrl: process.env.DATABASE_URL || './plxyground.db',
};

// Validate required env vars
if (!config.jwtSecret || config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

module.exports = config;
