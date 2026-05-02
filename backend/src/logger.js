'use strict';

const levels = { info: 'INFO', warn: 'WARN', error: 'ERROR' };

function log(level, message, meta) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${levels[level]}]`;
  if (meta !== undefined) {
    process.stdout.write(`${prefix} ${message} ${JSON.stringify(meta)}\n`);
  } else {
    process.stdout.write(`${prefix} ${message}\n`);
  }
}

const logger = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};

module.exports = logger;
