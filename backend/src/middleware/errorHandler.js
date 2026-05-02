'use strict';
const logger = require('../logger');

function errorHandler(err, req, res, _next) {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  const status = err.status || 500;
  return res.status(status).json({ error: err.message || 'Internal server error.' });
}

module.exports = errorHandler;
