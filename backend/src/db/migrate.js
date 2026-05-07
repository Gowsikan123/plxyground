'use strict';
const sql = require('./client');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

async function migrate() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    // Split on semicolons and run each statement
    const statements = schema.split(';').map(s => s.trim()).filter(Boolean);
    for (const statement of statements) {
      await sql.unsafe(statement);
    }
    logger.info('Migration complete');
  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
