'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');

function signToken({ sub, type }) {
  return jwt.sign({ sub, type }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
