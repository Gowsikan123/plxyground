'use strict';
require('dotenv').config();

const PORT = parseInt(process.env.PORT || '3011', 10);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('Config error: DATABASE_URL is required');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('Config error: JWT_SECRET must be at least 32 characters');
}

const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN) throw new Error('Config error: CORS_ORIGIN is required');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const NODE_ENV = process.env.NODE_ENV || 'development';

const config = Object.freeze({
  PORT,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CORS_ORIGIN,
  NODE_ENV,
});

module.exports = config;
