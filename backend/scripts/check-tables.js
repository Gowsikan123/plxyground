'use strict';
require('dotenv').config({ path: process.env.DOTENV_PATH || '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

(async () => {
  const rows = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  if (rows.length === 0) {
    console.log('No tables found — schema has not been applied to this database.');
  } else {
    console.log('Tables found:');
    rows.forEach(r => console.log(' -', r.table_name));
  }
})();
