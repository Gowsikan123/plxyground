'use strict';

function formatMessage(level, msg) {
  const ts = new Date().toISOString();
  return `[${ts}] ${level}: ${msg}`;
}

const logger = {
  info(msg) {
    process.stdout.write(formatMessage('INFO', msg) + '\n');
  },
  warn(msg) {
    process.stdout.write(formatMessage('WARN', msg) + '\n');
  },
  error(msg) {
    process.stderr.write(formatMessage('ERROR', msg) + '\n');
  },
};

module.exports = logger;
