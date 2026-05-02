'use strict';

const { port } = require('./config');
const { setup } = require('./db/setup');
const { seed } = require('./db/seed');
const logger = require('./logger');
const app = require('./app');

async function start() {
  try {
    await setup();
    await seed();
    app.listen(port, () => {
      logger.info(`PLXYGROUND API running on port ${port}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
