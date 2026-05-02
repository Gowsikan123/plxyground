'use strict';

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const current = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

function log(level, message, meta) {
  if (levels[level] > levels[current]) return;
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  if (meta) {
    process.stdout.write(base + ' ' + JSON.stringify(meta) + '\n');
  } else {
    process.stdout.write(base + '\n');
  }
}

module.exports = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
