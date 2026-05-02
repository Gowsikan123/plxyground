'use strict';

require('dotenv').config();

const config = require('./src/config');
const logger = require('./src/logger');
const db     = require('./src/db/client');
const setup  = require('./src/db/setup');
const app    = require('./src/app');

async function start() {
  try {
    await setup();
    logger.info('Database schema ready');

    const server = app.listen(config.port, () => {
      logger.info(`PLXYGROUND API listening on port ${config.port}`, {
        env: config.nodeEnv,
        port: config.port,
      });
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await db.end();
        logger.info('Database pool closed. Bye.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Startup failed', err);
    process.exit(1);
  }
}

start();
