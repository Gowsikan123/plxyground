'use strict';
const app = require('./app');
const config = require('./config');
const logger = require('./logger');
const { testConnection } = require('./db/client');
const { setup } = require('./db/setup');

async function start() {
  try {
    await testConnection();
    await setup();

    app.listen(config.port, () => {
      logger.info(`PLXYGROUND API running`, { port: config.port, env: config.env });
    });
  } catch (err) {
    logger.error('Startup failed', { message: err.message });
    process.exit(1);
  }
}

start();
