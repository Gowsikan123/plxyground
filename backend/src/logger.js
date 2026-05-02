'use strict';

const { nodeEnv } = require('./config');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? (nodeEnv === 'production' ? LEVELS.info : LEVELS.debug);

function format(level, message, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  if (meta && Object.keys(meta).length) {
    return `${base} ${JSON.stringify(meta)}`;
  }
  return base;
}

const logger = {
  error(message, meta = {}) {
    if (currentLevel >= LEVELS.error) console.error(format('error', message, meta));
  },
  warn(message, meta = {}) {
    if (currentLevel >= LEVELS.warn) console.warn(format('warn', message, meta));
  },
  info(message, meta = {}) {
    if (currentLevel >= LEVELS.info) console.info(format('info', message, meta));
  },
  debug(message, meta = {}) {
    if (currentLevel >= LEVELS.debug) console.debug(format('debug', message, meta));
  },
};

module.exports = logger;
