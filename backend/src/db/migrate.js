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

// schema.sql is the baseline; files in migrations/ apply on top, in name order.
function migrationFiles() {
  const dir = path.join(__dirname, 'migrations');
  return [
    { name: '000_schema.sql', file: path.join(__dirname, 'schema.sql') },
    ...fs.readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map((f) => ({ name: f, file: path.join(dir, f) })),
  ];
}

/**
 * Applies any migration not yet recorded in schema_migrations.
 * Every statement is idempotent, so two instances racing on a cold start is safe.
 * Returns the names of the migrations it applied.
 */
async function migrate() {
  await sql.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const { rows } = await sql.query('SELECT name FROM schema_migrations');
  const done = new Set(rows.map((r) => r.name));

  const applied = [];
  for (const { name, file } of migrationFiles()) {
    if (done.has(name)) continue;
    for (const statement of splitStatements(fs.readFileSync(file, 'utf8'))) {
      await sql.query(statement);
    }
    await sql.query('INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
    logger.info(`Applied migration ${name}`);
    applied.push(name);
  }
  return applied;
}

// Memoised for the API: the first request on a cold start brings the schema up to date.
let pending = null;
let lastFailureAt = 0;
const RETRY_AFTER_MS = 60_000;
function ensureMigrated() {
  if (!pending && Date.now() - lastFailureAt < RETRY_AFTER_MS) return Promise.resolve([]);
  if (!pending) {
    pending = migrate().catch((err) => {
      pending = null; // allow a retry after RETRY_AFTER_MS
      lastFailureAt = Date.now();
      throw err;
    });
  }
  return pending;
}

module.exports = { migrate, ensureMigrated, splitStatements };

// CLI: `npm run migrate`
if (require.main === module) {
  migrate()
    .then((applied) => logger.info(applied.length ? `Migration complete (${applied.length} applied)` : 'Already up to date'))
    .catch((err) => {
      logger.error(`Migration failed: ${err.message}`);
      process.exitCode = 1;
    })
    .finally(() => sql.end());
}
