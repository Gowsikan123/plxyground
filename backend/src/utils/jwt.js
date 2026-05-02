'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');

function signToken(payload, isAdmin = false) {
  const secret  = isAdmin ? config.adminJwt.secret  : config.jwt.secret;
  const expires = isAdmin ? config.adminJwt.expiresIn : config.jwt.expiresIn;
  return jwt.sign(payload, secret, { expiresIn: expires, algorithm: 'HS256' });
}

function verifyToken(token, isAdmin = false) {
  const secret = isAdmin ? config.adminJwt.secret : config.jwt.secret;
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = { signToken, verifyToken, decodeToken };
