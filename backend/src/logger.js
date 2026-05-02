'use strict';

const { env } = require('./config');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const LEVEL_NAMES = ['error', 'warn', 'info', 'debug'];
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? (env === 'production' ? LEVELS.info : LEVELS.debug);

function format(level, message, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase().padEnd(5)}] ${message}`;
  if (meta && Object.keys(meta).length) {
    try {
      return `${base} ${JSON.stringify(meta)}`;
    } catch {
      return `${base} [unserializable meta]`;
    }
  }
  return base;
}

function write(level, message, meta = {}) {
  if (LEVELS[level] > currentLevel) return;
  const line = format(level, message, meta);
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

const logger = {
  error: (msg, meta) => write('error', msg, meta),
  warn:  (msg, meta) => write('warn',  msg, meta),
  info:  (msg, meta) => write('info',  msg, meta),
  debug: (msg, meta) => write('debug', msg, meta),
  http:  (msg, meta) => write('debug', msg, meta),
};

module.exports = logger;
