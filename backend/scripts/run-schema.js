'use strict';
require('dotenv').config({ path: process.env.DOTENV_PATH || '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

(async () => {
  const schemaPath = path.join(__dirname, '../src/db/schema.sql');
  const raw = fs.readFileSync(schemaPath, 'utf8');

  // Split on semicolons, filter out empty/comment-only lines
  const statements = raw
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Running ${statements.length} statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await sql.unsafe(stmt + ';');
      // Print first line of each statement so we can track progress
      console.log(`  [${i + 1}/${statements.length}] OK: ${stmt.split('\n')[0].slice(0, 60)}`);
    } catch (err) {
      console.error(`  [${i + 1}/${statements.length}] FAILED: ${stmt.split('\n')[0].slice(0, 60)}`);
      console.error('  Error:', err.message);
    }
  }

  console.log('\nDone. Checking tables...');
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log('Tables:', tables.map(r => r.table_name));
})();
