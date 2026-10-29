'use strict';
/**
 * Database client.
 *
 * Exports `sql`, which works two ways:
 *   const rows = await sql`SELECT * FROM creators WHERE id = ${id}`;      // tagged template → rows
 *   const { rows, rowCount } = await sql.query('SELECT ... WHERE id = $1', [id]); // dynamic SQL
 *
 * Production (Vercel) talks to Neon over HTTP with @neondatabase/serverless.
 * Any other Postgres URL (local dev, CI) uses the standard `pg` driver, so the
 * same code and tests run against a normal Postgres server.
 */
const config = require('../config');
const logger = require('../logger');

const url = config.DATABASE_URL;
const useNeon = process.env.DB_DRIVER === 'neon' || /\.neon\.tech/.test(url);

let tagged;
let query;
let end;

if (useNeon) {
  const { neon } = require('@neondatabase/serverless');
  const rowsClient = neon(url);
  const fullClient = neon(url, { fullResults: true });
  tagged = rowsClient;
  query = async (text, params = []) => {
    const result = await fullClient(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  };
  end = async () => {};
  logger.info('Database: Neon serverless driver');
} else {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: url });
  query = async (text, params = []) => {
    const result = await pool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  };
  tagged = async (strings, ...values) => {
    let text = strings[0];
    values.forEach((_, i) => { text += `$${i + 1}${strings[i + 1]}`; });
    const { rows } = await query(text, values);
    return rows;
  };
  end = () => pool.end();
  logger.info('Database: node-postgres driver');
}

function sql(strings, ...values) {
  return tagged(strings, ...values);
}
sql.query = query;
sql.end = end;

module.exports = sql;
