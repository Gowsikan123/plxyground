'use strict';
// Shim so tests can import { readEnv } from '../src/config/env'
const config = require('../config');

function readEnv() {
  return {
    port: config.port,
    databaseUrl: config.databaseUrl,
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn,
    corsOrigins: Array.isArray(config.corsOrigin) ? config.corsOrigin : [config.corsOrigin],
    nodeEnv: config.nodeEnv,
  };
}

module.exports = { readEnv };
