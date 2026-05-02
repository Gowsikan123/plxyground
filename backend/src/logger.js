'use strict';

const levels = { info: 'INFO', warn: 'WARN', error: 'ERROR' };

function formatMessage(level, message, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level}] ${message}`;
  if (meta !== undefined) {
    return `${base} ${typeof meta === 'object' ? JSON.stringify(meta) : meta}`;
  }
  return base;
}

const logger = {
  info(message, meta) {
    process.stdout.write(formatMessage(levels.info, message, meta) + '\n');
  },
  warn(message, meta) {
    process.stderr.write(formatMessage(levels.warn, message, meta) + '\n');
  },
  error(message, meta) {
    process.stderr.write(formatMessage(levels.error, message, meta) + '\n');
  },
};

module.exports = logger;
