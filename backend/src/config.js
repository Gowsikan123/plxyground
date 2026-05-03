'use strict';
require('dotenv').config();

function required(key, minLength) {
  const val = process.env[key];
  if (!val) {
    throw new Error(`[config] Missing required environment variable: ${key}`);
  }
  if (minLength && val.length < minLength) {
    throw new Error(`[config] ${key} must be at least ${minLength} characters long. Current length: ${val.length}`);
  }
  return val;
}

function optional(key, defaultValue) {
  return process.env[key] || defaultValue;
}

const config = Object.freeze({
  PORT: parseInt(optional('PORT', '3011'), 10),
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET', 32),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),
  CORS_ORIGIN: required('CORS_ORIGIN'),
  NODE_ENV: optional('NODE_ENV', 'development'),
});

module.exports = config;
