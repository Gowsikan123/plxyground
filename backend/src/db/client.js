'use strict';
const { neon } = require('@neondatabase/serverless');
const config = require('../config');
const logger = require('../logger');

const sql = neon(config.DATABASE_URL);

logger.info('Neon Postgres client initialised');

module.exports = sql;
