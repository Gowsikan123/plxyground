'use strict';

const { Pool } = require('pg');
const config = require('../config');
const logger = require('../logger');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool(config.db);

    pool.on('connect', () => {
      logger.debug('pg pool: new client connected');
    });

    pool.on('error', (err) => {
      logger.error('pg pool: unexpected error on idle client', { message: err.message });
    });
  }
  return pool;
}

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    logger.debug('db query', { duration: Date.now() - start, rows: res.rowCount });
    return res;
  } catch (err) {
    logger.error('db query error', { message: err.message, query: text });
    throw err;
  }
}

async function getClient() {
  return getPool().connect();
}

async function end() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('pg pool: all connections closed');
  }
}

module.exports = { query, getClient, getPool, end };
