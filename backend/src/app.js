const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('./db/setup');

function createApp(config) {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.nodeEnv === 'development') return cb(null, true);
      if (!config.corsOrigins.length || config.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
  app.use('/api/auth', authLimiter);
  app.use('/api/admin/auth', authLimiter);

  app.get('/healthz', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/', (req, res) => res.json({ name: 'PLXYGROUND API', version: '1.0.0' }));

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/business', require('./routes/business'));
  app.use('/api/business/content', require('./routes/businessContent'));
  app.use('/api/content', require('./routes/content'));
  app.use('/api/creators', require('./routes/creators'));
  app.use('/api/opportunities', require('./routes/opportunities'));
  app.use('/api/admin/auth', require('./routes/admin/adminAuth'));
  app.use('/api/admin/content', require('./routes/admin/adminContent'));
  app.use('/api/admin/opportunities', require('./routes/admin/adminOpportunities'));
  app.use('/api/admin/users', require('./routes/admin/adminUsers'));
  app.use('/api/admin/queue', require('./routes/admin/adminQueue'));
  app.use('/api/admin/audit', require('./routes/admin/adminAudit'));
  app.use('/api/admin/analytics', require('./routes/admin/adminAnalytics'));
  app.use('/api/admin/alerts', require('./routes/admin/adminAlerts'));

  app.get('/terms', (req, res) => res.send(`
  <html><body style="font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px">
  <h1>Terms of Service</h1>
  <p>By using PLXYGROUND you agree to our community guidelines. You must not post harmful, misleading, or inappropriate content. We reserve the right to suspend accounts that violate these terms.</p>
  <p>Content you post remains yours but you grant PLXYGROUND a licence to display it on the platform.</p>
  </body></html>
`));

  app.get('/privacy', (req, res) => res.send(`
  <html><body style="font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px">
  <h1>Privacy Policy</h1>
  <p>PLXYGROUND collects only the data necessary to provide the service. This includes your name, email address, and content you post.</p>
  <p>We do not sell your data to third parties. Your password is stored as a secure hash and never in plain text.</p>
  </body></html>
`));

  app.get('/support', (req, res) => res.send(`
  <html><body style="font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px">
  <h1>Support</h1>
  <p>For help, contact us at support@plxyground.local</p>
  </body></html>
`));

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
