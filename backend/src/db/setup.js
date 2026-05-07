'use strict';
const sql = require('./client');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

async function setupDatabase() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await sql.transaction(txn => txn.unsafe(schema));
    logger.info('Database schema applied successfully');
  } catch (err) {
    logger.error('Failed to apply schema:', err);
    throw err;
  }
}

module.exports = { setupDatabase };
