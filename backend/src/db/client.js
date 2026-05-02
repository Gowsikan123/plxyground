'use strict';
const { Pool } = require('pg');
const { readEnv } = require('../config/env');
const config = readEnv();

const pool = new Pool({ connectionString: config.databaseUrl });

// Compatibility wrapper: db.prepare(sql).get/all/run match better-sqlite3 API
// but are now async and use $1,$2... positional params (Postgres style)
const db = {
  pool,
  prepare(sql) {
    return {
      async get(...params) {
        const r = await pool.query(sql, params.length ? params : undefined);
        return r.rows[0] || null;
      },
      async all(...params) {
        const r = await pool.query(sql, params.length ? params : undefined);
        return r.rows;
      },
      async run(...params) {
        const r = await pool.query(sql, params.length ? params : undefined);
        const lastInsertRowid = r.rows[0]?.id ?? null;
        return { lastInsertRowid, changes: r.rowCount };
      },
    };
  },
  async exec(sql) {
    await pool.query(sql);
  },
  async query(sql, params) {
    return pool.query(sql, params);
  },
};

module.exports = db;
