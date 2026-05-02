'use strict';

const levels = { info: 'INFO', warn: 'WARN', error: 'ERROR' };

function log(level, message, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level}] ${message}`;
  if (meta !== undefined) {
    process.stdout.write(base + ' ' + JSON.stringify(meta) + '\n');
  } else {
    process.stdout.write(base + '\n');
  }
}

const logger = {
  info: (msg, meta) => log(levels.info, msg, meta),
  warn: (msg, meta) => log(levels.warn, msg, meta),
  error: (msg, meta) => log(levels.error, msg, meta),
};

module.exports = logger;
