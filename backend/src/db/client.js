'use strict';

const { Pool } = require('pg');
const { databaseUrl } = require('../config');
const logger = require('../logger');

const pool = new Pool({ connectionString: databaseUrl });

pool.on('connect', () => {
  logger.info('PostgreSQL pool connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', err);
});

module.exports = pool;
