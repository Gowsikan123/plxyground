'use strict';

const LEVELS = { info: 'INFO', warn: 'WARN', error: 'ERROR' };

function log(level, message, meta) {
  const ts = new Date().toISOString();
  const label = LEVELS[level] || 'INFO';
  const base = `[${ts}] [${label}] ${message}`;
  if (meta !== undefined) {
    const extra = meta instanceof Error
      ? { message: meta.message, stack: meta.stack }
      : meta;
    process.stdout.write(`${base} ${JSON.stringify(extra)}\n`);
  } else {
    process.stdout.write(`${base}\n`);
  }
}

const logger = {
  info:  (msg, meta) => log('info',  msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};

module.exports = logger;
