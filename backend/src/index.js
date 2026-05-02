'use strict';
require('dotenv').config();
const config = require('./config');
const logger = require('./logger');
const { setupDatabase } = require('./db/setup');

setupDatabase();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const { globalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businessAuth');
const contentRoutes = require('./routes/content');
const creatorRoutes = require('./routes/creators');
const opportunityRoutes = require('./routes/opportunities');
const adminAuthRoutes = require('./routes/admin/auth');
const adminQueueRoutes = require('./routes/admin/queue');
const adminContentRoutes = require('./routes/admin/content');
const adminUsersRoutes = require('./routes/admin/users');
const adminAnalyticsRoutes = require('./routes/admin/analytics');
const adminAuditRoutes = require('./routes/admin/audit');

const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({ origin: config.CORS_ORIGIN.split(','), credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

app.get('/healthz', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.json({ success: true, name: 'PLXYGROUND API', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/queue', adminQueueRoutes);
app.use('/api/admin/content', adminContentRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/audit', adminAuditRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

app.listen(config.PORT, () => {
  logger.info(`PLXYGROUND API running on port ${config.PORT} [${config.NODE_ENV}]`);
});

module.exports = app;
