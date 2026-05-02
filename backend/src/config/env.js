'use strict';
// Shim: tests import { readEnv } from '../src/config/env'
const config = require('../config');

function readEnv() {
  return config;
}

module.exports = { readEnv };
