'use strict';
const { Pool } = require('pg');
const config = require('../config');
const logger = require('../logger');

const pool = new Pool({ connectionString: config.databaseUrl });

pool.on('connect', () => {
  logger.info('[db] PostgreSQL client connected');
});

pool.on('error', (err) => {
  logger.error('[db] Unexpected error on idle client', { message: err.message });
});

module.exports = pool;
