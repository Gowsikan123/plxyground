'use strict';
require('dotenv').config({ path: process.env.DOTENV_PATH || '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

(async () => {
  const client = new Client({ connectionString });
  await client.connect();

  const { rows } = await client.query(
    `SELECT schemaname, tablename FROM pg_tables
     WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
     ORDER BY schemaname, tablename`
  );

  if (rows.length === 0) {
    console.log('No user tables found anywhere.');
  } else {
    rows.forEach(r => console.log(`  ${r.schemaname}.${r.tablename}`));
  }

  await client.end();
})();
