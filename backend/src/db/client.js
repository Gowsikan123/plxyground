'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config');

const dbPath = path.isAbsolute(config.databaseUrl)
  ? config.databaseUrl
  : path.resolve(process.cwd(), config.databaseUrl);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
