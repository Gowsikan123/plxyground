'use strict';
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3011,
  databaseUrl: process.env.DATABASE_URL || './plxyground.db',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_in_production_32chars',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:19006,http://localhost:3012').split(','),
  nodeEnv: process.env.NODE_ENV || 'development',
};
