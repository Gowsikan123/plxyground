'use strict';

const { Pool } = require('pg');
const { databaseUrl, nodeEnv } = require('../config');
const logger = require('../logger');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected pg pool error', { message: err.message });
    });
  }
  return pool;
}

module.exports = { getPool };
