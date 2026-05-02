/**
 * Smoke tests for /api/content routes.
 */
const request = require('supertest');
const app = require('../app');

describe('GET /api/content', () => {
  it('returns 200 with data array', async () => {
    const res = await request(app).get('/api/content');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('accepts type filter', async () => {
    const res = await request(app).get('/api/content?type=video');
    expect(res.status).toBe(200);
  });

  it('accepts pagination', async () => {
    const res = await request(app).get('/api/content?page=1&limit=10');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/content/:id', () => {
  it('returns 404 for non-existent post', async () => {
    const res = await request(app).get('/api/content/99999999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/content', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/content')
      .send({ title: 'Test post', type: 'text' });
    expect(res.status).toBe(401);
  });
});
