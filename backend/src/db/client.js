'use strict';

const { Pool } = require('pg');
const config = require('../config');
const logger = require('../logger');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('connect', () => {
      logger.info('PostgreSQL pool: new client connected');
    });

    pool.on('error', (err) => {
      logger.error('PostgreSQL pool error', { message: err.message });
    });
  }
  return pool;
}

module.exports = { getPool };
