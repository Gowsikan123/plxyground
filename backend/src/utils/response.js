'use strict';

/**
 * Standardised JSON response helpers.
 * All API responses go through these so the shape is always consistent:
 *
 *   Success: { success: true,  data: <payload>,  meta?: <pagination> }
 *   Error:   { success: false, error: <message>, code?: <string> }
 */

/**
 * Send a 200 OK success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {object} [meta]  Optional pagination / count metadata
 */
function ok(res, data, meta) {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(200).json(body);
}

/**
 * Send a 201 Created success response.
 * @param {import('express').Response} res
 * @param {*} data
 */
function created(res, data) {
  return res.status(201).json({ success: true, data });
}

/**
 * Send a 400 Bad Request error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {string} [code]
 */
function badRequest(res, message, code) {
  return res.status(400).json({ success: false, error: message, ...(code && { code }) });
}

/**
 * Send a 401 Unauthorised response.
 * @param {import('express').Response} res
 * @param {string} [message]
 */
function unauthorised(res, message = 'Unauthorised') {
  return res.status(401).json({ success: false, error: message, code: 'UNAUTHORISED' });
}

/**
 * Send a 403 Forbidden response.
 * @param {import('express').Response} res
 * @param {string} [message]
 */
function forbidden(res, message = 'Forbidden') {
  return res.status(403).json({ success: false, error: message, code: 'FORBIDDEN' });
}

/**
 * Send a 404 Not Found response.
 * @param {import('express').Response} res
 * @param {string} [message]
 */
function notFound(res, message = 'Not found') {
  return res.status(404).json({ success: false, error: message, code: 'NOT_FOUND' });
}

/**
 * Send a 409 Conflict response.
 * @param {import('express').Response} res
 * @param {string} message
 */
function conflict(res, message) {
  return res.status(409).json({ success: false, error: message, code: 'CONFLICT' });
}

/**
 * Send a 422 Unprocessable Entity response.
 * Used for validation errors from express-validator.
 * @param {import('express').Response} res
 * @param {Array} errors  Array of { field, message } objects
 */
function validationError(res, errors) {
  return res.status(422).json({
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    errors,
  });
}

/**
 * Send a 500 Internal Server Error response.
 * Never expose raw error messages in production.
 * @param {import('express').Response} res
 * @param {Error} [err]  Logged internally but not sent to client
 */
function serverError(res, err) {
  if (err) {
    // logger is imported lazily to avoid circular deps
    try {
      const logger = require('../logger');
      logger.error('Internal server error', { message: err.message, stack: err.stack });
    } catch (_) {
      // eslint-disable-next-line no-console
      console.error('[serverError]', err);
    }
  }
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err?.message ?? 'Internal server error',
    code: 'SERVER_ERROR',
  });
}

module.exports = { ok, created, badRequest, unauthorised, forbidden, notFound, conflict, validationError, serverError };
