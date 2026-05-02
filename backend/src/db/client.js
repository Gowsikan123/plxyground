'use strict';
const Database = require('better-sqlite3');
const config = require('../config');
const logger = require('../logger');

const db = new Database(config.DATABASE_URL);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
logger.info(`SQLite connected: ${config.DATABASE_URL}`);

module.exports = db;
