'use strict';
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL_UNPOOLED);

(async () => {
  const rows = await sql`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  console.log('Tables:', rows.map(r => r.tablename));
})().catch(err => { console.error(err.message); process.exit(1); });
