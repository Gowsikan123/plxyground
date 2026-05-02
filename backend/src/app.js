'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { corsOrigins } = require('./config');
const { globalLimiter } = require('./middleware/rateLimiter');
const logger = require('./logger');

const authRouter         = require('./routes/auth');
const businessAuthRouter = require('./routes/businessAuth');
const contentRouter      = require('./routes/content');
const creatorsRouter     = require('./routes/creators');
const opportunitiesRouter = require('./routes/opportunities');
const adminAuthRouter    = require('./routes/admin/auth');
const adminQueueRouter   = require('./routes/admin/queue');
const adminUsersRouter   = require('./routes/admin/users');
const adminContentRouter = require('./routes/admin/content');
const adminAnalyticsRouter = require('./routes/admin/analytics');
const adminAuditRouter   = require('./routes/admin/audit');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: corsOrigins.includes('*') ? '*' : corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(globalLimiter);

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

app.get('/healthz', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/api/auth',         authRouter);
app.use('/api/business',     businessAuthRouter);
app.use('/api/content',      contentRouter);
app.use('/api/creators',     creatorsRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/admin/auth',   adminAuthRouter);
app.use('/api/admin/queue',  adminQueueRouter);
app.use('/api/admin/users',  adminUsersRouter);
app.use('/api/admin/content', adminContentRouter);
app.use('/api/admin/analytics', adminAnalyticsRouter);
app.use('/api/admin/audit',  adminAuditRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
