'use strict';

const LEVELS = { info: 'INFO', warn: 'WARN', error: 'ERROR' };

function format(level, message, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${LEVELS[level]}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(meta)}`;
  }
  return base;
}

const logger = {
  info(message, meta = {}) {
    process.stdout.write(format('info', message, meta) + '\n');
  },
  warn(message, meta = {}) {
    process.stdout.write(format('warn', message, meta) + '\n');
  },
  error(message, meta = {}) {
    process.stderr.write(format('error', message, meta) + '\n');
  },
};

module.exports = logger;
