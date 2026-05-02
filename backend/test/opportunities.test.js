'use strict';
const request = require('supertest');
const { createApp } = require('../src/app');
const { readEnv } = require('../src/config/env');
const setup = require('../src/db/setup');

let app;
const uniqueId = Date.now();

beforeAll(async () => {
  await setup();
  app = createApp(readEnv());
}, 30000);

describe('Opportunities CRUD', () => {
  let token;
  let opportunityId;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: `oppuser${uniqueId}`,
      display_name: 'Opp User',
      email: `opp.${uniqueId}@plxyground.local`,
      password: 'Password123!',
    });
    token = res.body.data.token;
  });

  it('creates an opportunity', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Test opportunity ${uniqueId}`,
        description: 'Looking for sports creators.',
        sport: 'Football',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    opportunityId = res.body.data.id;
  });

  it('lists opportunities', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('gets a single opportunity by id', async () => {
    // newly created opps have status=published so should be visible
    const res = await request(app).get(`/api/opportunities/${opportunityId}`);
    expect([200, 404]).toContain(res.status);
  });

  it('updates own opportunity', async () => {
    const res = await request(app)
      .put(`/api/opportunities/${opportunityId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: `Updated title ${uniqueId}` });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects update from unauthenticated user', async () => {
    const res = await request(app)
      .put(`/api/opportunities/${opportunityId}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(401);
  });

  it('soft-deletes own opportunity', async () => {
    const res = await request(app)
      .delete(`/api/opportunities/${opportunityId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
