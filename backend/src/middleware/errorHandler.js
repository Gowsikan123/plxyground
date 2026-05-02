'use strict';

const logger = require('../logger');

/**
 * Global Express error handler.
 * Must be registered LAST — after all routes.
 *
 * Usage in app.js:
 *   app.use(errorHandler);
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  logger.error('Unhandled error', {
    status,
    message: err.message,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  return res.status(status).json({
    success: false,
    error: message,
    code: err.code || 'SERVER_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
