'use strict';
const request = require('supertest');
const { createApp } = require('../src/app');
const setup = require('../src/db/setup');

let app;
const uid = Date.now();
let token;
let opportunityId;

beforeAll(async () => {
  await setup();
  app = createApp();
  const res = await request(app).post('/api/auth/signup').send({
    username: `oppsmoke${uid}`,
    display_name: 'Opp Smoke',
    email: `oppsmoke.${uid}@plxyground.local`,
    password: 'Password123!',
  });
  token = res.body.data && res.body.data.token;
}, 30000);

describe('Opportunities', () => {
  it('GET /api/opportunities returns list', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('POST creates opportunity when authenticated', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Smoke Opp ${uid}`,
        description: 'Smoke test opportunity description',
        sport: 'Football',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    opportunityId = res.body.data.id;
  });

  it('POST returns 401 without auth', async () => {
    const res = await request(app).post('/api/opportunities').send({
      title: 'Unauth opp',
      description: 'Should fail',
      sport: 'Tennis',
    });
    expect(res.status).toBe(401);
  });

  it('DELETE own opportunity', async () => {
    if (!opportunityId) return;
    const res = await request(app)
      .delete(`/api/opportunities/${opportunityId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
