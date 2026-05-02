'use strict';

const app = require('./app');
const { port } = require('./config');
const { setupDatabase } = require('./db/setup');
const logger = require('./logger');

async function start() {
  try {
    await setupDatabase();
    logger.info('Database ready');

    app.listen(port, () => {
      logger.info(`PLXYGROUND API running on port ${port}`);
    });
  } catch (err) {
    logger.error('Fatal startup error', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
