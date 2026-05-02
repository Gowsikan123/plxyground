'use strict';
require('dotenv').config();

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`[config] Missing required environment variable: ${key}`);
  return val;
}

function optional(key, defaultValue) {
  return process.env[key] || defaultValue;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('[config] JWT_SECRET must be at least 32 characters long');
}

const config = Object.freeze({
  PORT: parseInt(optional('PORT', '3011'), 10),
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),
  CORS_ORIGIN: required('CORS_ORIGIN'),
  NODE_ENV: optional('NODE_ENV', 'development'),
});

module.exports = config;
