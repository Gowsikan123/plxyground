'use strict';

require('dotenv').config();
const app = require('./app');
const config = require('./config');
const logger = require('./logger');
const { setupDatabase } = require('./db/setup');
const { seedDatabase } = require('./db/seed');
const db = require('./db/client');

async function start() {
  try {
    await setupDatabase();
    await seedDatabase();

    const server = app.listen(config.port, () => {
      logger.info(`PLXYGROUND API running`, { port: config.port, env: config.env });
    });

    async function shutdown(signal) {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await db.end();
        logger.info('Server closed');
        process.exit(0);
      });
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', { message: err.message });
    process.exit(1);
  }
}

start();
