'use strict';
require('dotenv').config({ path: process.env.DOTENV_PATH || '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

(async () => {
  const rows = await sql`
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema') 
    ORDER BY schemaname, tablename
  `;
  if (rows.length === 0) {
    console.log('No user tables found anywhere.');
  } else {
    rows.forEach(r => console.log(`  ${r.schemaname}.${r.tablename}`));
  }
})();
