'use strict';
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  // Wrap in a transaction so partial failures are rolled back cleanly
  await pool.query('BEGIN');
  try {
    await pool.query(sql);
    await pool.query('COMMIT');
    process.stdout.write('Migration complete.\n');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => { console.error(err); process.exit(1); });
