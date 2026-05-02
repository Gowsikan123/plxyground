'use strict';

const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn, adminJwtSecret, adminJwtExpiresIn } = require('../config');

function signToken(payload, type = 'creator') {
  const secret = type === 'admin' ? adminJwtSecret : jwtSecret;
  const expiresIn = type === 'admin' ? adminJwtExpiresIn : jwtExpiresIn;
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token, type = 'creator') {
  const secret = type === 'admin' ? adminJwtSecret : jwtSecret;
  try {
    return { payload: jwt.verify(token, secret), error: null };
  } catch (err) {
    return { payload: null, error: err.message };
  }
}

module.exports = { signToken, verifyToken };
