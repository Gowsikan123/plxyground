'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Signs a JWT for the given payload.
 * @param {object} payload
 * @returns {string}
 */
function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

/**
 * Verifies a JWT and returns the decoded payload.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 * @param {string} token
 * @returns {object}
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { signToken, verifyToken };
