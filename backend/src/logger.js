'use strict';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const env = process.env.NODE_ENV || 'development';
const minLevel = LEVELS[process.env.LOG_LEVEL] ?? (env === 'production' ? LEVELS.info : LEVELS.debug);

function timestamp() {
  return new Date().toISOString();
}

function format(level, message, meta) {
  const base = { ts: timestamp(), level, message };
  if (meta && Object.keys(meta).length) base.meta = meta;
  return env === 'production' ? JSON.stringify(base) : `[${base.ts}] ${level.toUpperCase().padEnd(5)} ${message}${meta ? ' ' + JSON.stringify(meta) : ''}`;
}

function log(level, message, meta = {}) {
  if (LEVELS[level] > minLevel) return;
  const out = format(level, message, meta);
  if (level === 'error') {
    process.stderr.write(out + '\n');
  } else {
    process.stdout.write(out + '\n');
  }
}

const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),

  // Express-style request logger middleware
  requestMiddleware: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      log('info', 'http', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - start,
        ip: req.ip,
      });
    });
    next();
  },
};

module.exports = logger;
