'use strict';

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info(msg) {
    process.stdout.write(`[${timestamp()}] INFO: ${msg}\n`);
  },
  warn(msg) {
    process.stdout.write(`[${timestamp()}] WARN: ${msg}\n`);
  },
  error(msg) {
    process.stderr.write(`[${timestamp()}] ERROR: ${msg}\n`);
  },
};

module.exports = logger;
