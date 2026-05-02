/**
 * Smoke tests for /api/opportunities routes.
 */
const request = require('supertest');
const app = require('../app');

describe('GET /api/opportunities', () => {
  it('returns 200 and an array', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('accepts sport filter param', async () => {
    const res = await request(app).get('/api/opportunities?sport=basketball');
    expect(res.status).toBe(200);
  });

  it('accepts pagination params', async () => {
    const res = await request(app).get('/api/opportunities?page=1&limit=5');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/opportunities/:id', () => {
  it('returns 404 for non-existent id', async () => {
    const res = await request(app).get('/api/opportunities/99999999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/opportunities', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .send({ title: 'Test Opp' });
    expect(res.status).toBe(401);
  });
});
