const { createApp } = require('../src/app');
const { readEnv } = require('../src/config/env');

module.exports = createApp(readEnv());
