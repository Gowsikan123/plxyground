'use strict';
require('dotenv').config({ path: process.env.DOTENV_PATH || '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to:', connectionString.split('@')[1].split('/')[0]);

  const schemaPath = path.join(__dirname, '../src/db/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await client.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Schema error:', err.message);
  }

  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
  );
  console.log('Tables now in DB:', rows.map(r => r.table_name));

  await client.end();
})();
