'use strict';
const fs = require('fs');
const path = require('path');
const sql = require('./client');
const logger = require('../logger');

// Splits a SQL file into statements, keeping $$ ... $$ blocks (DO / functions) intact.
// Needed because the Neon HTTP driver runs one statement per request.
function splitStatements(text) {
  const statements = [];
  let current = '';
  let inDollar = false;
  for (const line of text.split('\n')) {
    if (line.trim().startsWith('--') && !inDollar) continue;
    current += line + '\n';
    const dollarCount = (line.match(/\$\$/g) || []).length;
    if (dollarCount % 2 === 1) inDollar = !inDollar;
    if (!inDollar && line.trim().endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

// Applies schema.sql, then every file in migrations/ in name order.
// All statements are idempotent (IF NOT EXISTS / DO blocks), so this is safe to re-run.
async function migrate() {
  const files = [
    path.join(__dirname, 'schema.sql'),
    ...fs.readdirSync(path.join(__dirname, 'migrations'))
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map((f) => path.join(__dirname, 'migrations', f)),
  ];
  try {
    for (const file of files) {
      for (const statement of splitStatements(fs.readFileSync(file, 'utf8'))) {
        await sql.query(statement);
      }
      logger.info(`Applied ${path.basename(file)}`);
    }
    logger.info('Migration complete');
  } catch (err) {
    logger.error(`Migration failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

migrate();
