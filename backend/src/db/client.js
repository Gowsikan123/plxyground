'use strict';
const { Pool } = require('pg');
const config = require('../config');
const logger = require('../logger');

let pool;

function getPool() {
  if (pool) return pool;

  pool = new Pool({
    connectionString: config.db.url,
    ssl: config.db.ssl,
    max: config.db.max,
    idleTimeoutMillis: config.db.idleTimeoutMillis,
    connectionTimeoutMillis: config.db.connectionTimeoutMillis,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected pg pool error', { message: err.message });
  });

  pool.on('connect', () => {
    logger.debug('pg pool: new client connected');
  });

  return pool;
}

async function query(text, params) {
  const client = getPool();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (err) {
    logger.error('DB query error', { message: err.message, query: text });
    throw err;
  }
}

async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function testConnection() {
  const res = await query('SELECT NOW() AS now');
  logger.info('DB connection OK', { time: res.rows[0].now });
  return true;
}

module.exports = { query, withTransaction, testConnection, getPool };
