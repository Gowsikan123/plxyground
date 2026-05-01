const { createApp } = require('./app');
const { readEnv } = require('./config/env');
const db = require('./db/setup');

const config = readEnv();
const app = createApp(config);

db.ready.then(() => {
  app.listen(config.port, () => {
    console.log(`PLXYGROUND backend running on http://localhost:${config.port}`);
    console.log(`Using database ${config.databaseLabel}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database', error);
  process.exit(1);
});
