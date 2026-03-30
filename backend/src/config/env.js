const path = require('path');
require('dotenv').config();

function readEnv() {
  const required = ['JWT_SECRET', 'JWT_EXPIRES_IN', 'DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key] || !String(process.env[key]).trim());

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const port = Number(process.env.PORT || 3011);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid integer between 1 and 65535');
  }

  return {
    port,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    databaseUrl: process.env.DATABASE_URL,
    corsOrigins: (process.env.CORS_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    databasePath: path.resolve(path.resolve(__dirname, '..', '..'), process.env.DATABASE_URL),
  };
}

module.exports = { readEnv };
