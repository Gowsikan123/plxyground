'use strict';
const Database = require('better-sqlite3');
const config = require('../config');
const logger = require('../logger');

const db = new Database(config.databaseUrl, {
  verbose: config.nodeEnv === 'development' ? (msg) => logger.debug(msg) : null,
});

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
