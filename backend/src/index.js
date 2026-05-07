'use strict';
require('dotenv').config();
const config = require('./config');
const logger = require('./logger');
const app = require('./app');

// Export for Vercel serverless
module.exports = app;

// Listen only in local dev
if (config.NODE_ENV !== 'production') {
  app.listen(config.PORT, () => {
    logger.info(`PLXYGROUND API listening on port ${config.PORT} [${config.NODE_ENV}]`);
  });
}
