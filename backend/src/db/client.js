'use strict';
const Database = require('better-sqlite3');
const config = require('../config');
const logger = require('../logger');

let instance;

function getDb() {
  if (!instance) {
    instance = new Database(config.DATABASE_URL);
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');
    logger.info(`Database connected: ${config.DATABASE_URL}`);
  }
  return instance;
}

module.exports = getDb();
