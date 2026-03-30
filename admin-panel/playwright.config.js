const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:3012',
    headless: true,
  },
  webServer: [
    {
      command: 'node src/index.js',
      cwd: '../backend',
      url: 'http://127.0.0.1:3011/healthz',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'node server.js',
      cwd: '.',
      url: 'http://127.0.0.1:3012',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
