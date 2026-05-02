'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../logger');

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
    issuer: 'plxyground',
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'plxyground',
  });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret, { issuer: 'plxyground' });
  } catch (err) {
    logger.debug('jwt: access token verification failed', { message: err.message });
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, { issuer: 'plxyground' });
  } catch (err) {
    logger.debug('jwt: refresh token verification failed', { message: err.message });
    return null;
  }
}

function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
