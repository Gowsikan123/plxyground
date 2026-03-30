const request = require('supertest');
const { createApp } = require('../src/app');
const { readEnv } = require('../src/config/env');

const app = createApp(readEnv());

describe('Content recommendation endpoint', () => {
  it('returns aggregate recommendations for unauthenticated user', async () => {
    const res = await request(app).get('/api/content/recommend');
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('aggregate');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
