const { createApp } = require('./app');
const { readEnv } = require('./config/env');

const config = readEnv();
const app = createApp(config);

app.listen(config.port, () => {
  console.log(`PLXYGROUND backend running on http://localhost:${config.port}`);
  console.log(`Using database at ${config.databasePath}`);
});
