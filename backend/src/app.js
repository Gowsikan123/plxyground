'use strict';

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const config   = require('./config');
const { globalLimiter } = require('./middleware/rateLimiter');
const logger   = require('./logger');

// ── Creator & public routes ──────────────────────────────────────────────────
const authRouter           = require('./routes/auth');
const businessAuthRouter   = require('./routes/businessAuth');
const contentRouter        = require('./routes/content');
const creatorsRouter       = require('./routes/creators');
const opportunitiesRouter  = require('./routes/opportunities');
const applicationsRouter   = require('./routes/applications');
const followsRouter        = require('./routes/follows');
const messagesRouter       = require('./routes/messages');
const notificationsRouter  = require('./routes/notifications');
const partnersRouter       = require('./routes/partners');
const businessPlanRouter   = require('./routes/business-plan');
const businessContentRouter = require('./routes/businessContent');

// ── Admin routes (files are named admin*.js) ─────────────────────────────────
const adminAuthRouter         = require('./routes/admin/adminAuth');
const adminQueueRouter        = require('./routes/admin/adminQueue');
const adminUsersRouter        = require('./routes/admin/adminUsers');
const adminContentRouter      = require('./routes/admin/adminContent');
const adminAnalyticsRouter    = require('./routes/admin/adminAnalytics');
const adminAuditRouter        = require('./routes/admin/adminAudit');
const adminOpportunitiesRouter = require('./routes/admin/adminOpportunities');
const adminAlertsRouter       = require('./routes/admin/adminAlerts');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: config.corsOrigin.includes('*') ? '*' : config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(globalLimiter);

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Public & creator API ─────────────────────────────────────────────────────
app.use('/api/auth',           authRouter);
app.use('/api/business',       businessAuthRouter);
app.use('/api/business',       businessContentRouter);
app.use('/api/business',       businessPlanRouter);
app.use('/api/content',        contentRouter);
app.use('/api/creators',       creatorsRouter);
app.use('/api/opportunities',  opportunitiesRouter);
app.use('/api/applications',   applicationsRouter);
app.use('/api/follows',        followsRouter);
app.use('/api/messages',       messagesRouter);
app.use('/api/notifications',  notificationsRouter);
app.use('/api/partners',       partnersRouter);

// ── Admin API ────────────────────────────────────────────────────────────────
app.use('/api/admin/auth',          adminAuthRouter);
app.use('/api/admin/queue',         adminQueueRouter);
app.use('/api/admin/users',         adminUsersRouter);
app.use('/api/admin/content',       adminContentRouter);
app.use('/api/admin/analytics',     adminAnalyticsRouter);
app.use('/api/admin/audit',         adminAuditRouter);
app.use('/api/admin/opportunities', adminOpportunitiesRouter);
app.use('/api/admin/alerts',        adminAlertsRouter);

// ── 404 & global error handler ───────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
