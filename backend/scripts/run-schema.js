'use strict';
require('dotenv').config({ path: process.env.DOTENV_PATH || '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

(async () => {
  const schemaPath = path.join(__dirname, '../src/db/schema.sql');
  const raw = fs.readFileSync(schemaPath, 'utf8');

  // Remove comment lines, then split on semicolons
  const cleaned = raw
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleaned
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Running ${statements.length} statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 70);
    try {
      await sql.unsafe(stmt + ';');
      console.log(`  [${i + 1}/${statements.length}] OK: ${preview}`);
    } catch (err) {
      console.error(`  [${i + 1}/${statements.length}] FAILED: ${preview}`);
      console.error('  Error:', err.message);
    }
  }

  console.log('\nDone. Checking tables...');
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log('Tables:', tables.map(r => r.table_name));
})();
