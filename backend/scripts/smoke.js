const { spawn } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendDir, '..');
const adminDir = path.resolve(repoRoot, 'admin-panel');
const backendUrl = 'http://127.0.0.1:3011';
const adminUrl = 'http://127.0.0.1:3012';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForUrl(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      // Keep polling until timeout.
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startNodeProcess(cwd, script, env = {}) {
  const child = spawn(process.execPath, [script], {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  return child;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  return { response, data };
}

async function expectJson(name, fn) {
  try {
    const detail = await fn();
    return { name, status: 'PASS', detail };
  } catch (error) {
    return { name, status: 'FAIL', detail: error.message };
  }
}

async function main() {
  // Explicitly pin each process to its own port so the inherited PORT env
  // var (set to 3011 by CI) does not cause the admin panel to collide with
  // the backend on the same port.
  const backendProcess = startNodeProcess(backendDir, 'src/index.js', { PORT: '3011' });
  const adminProcess = startNodeProcess(adminDir, 'server.js', { PORT: '3012' });
  const results = [];

  try {
    await waitForUrl(`${backendUrl}/healthz`);
    await waitForUrl(adminUrl);

    results.push(await expectJson('ST-API-001 /healthz', async () => {
      const { response, data } = await requestJson(`${backendUrl}/healthz`);
      if (!response.ok || data.status !== 'ok') throw new Error('Health check failed');
      return data.timestamp;
    }));

    results.push(await expectJson('ST-API-002 /', async () => {
      const { response, data } = await requestJson(`${backendUrl}/`);
      if (!response.ok || data.name !== 'PLXYGROUND API') throw new Error('Root endpoint failed');
      return data.version;
    }));

    const nonce = Date.now();
    const creatorSignupPayload = {
      name: `Smoke Creator ${nonce}`,
      email: `smoke.creator.${nonce}@plxyground.local`,
      password: 'Password1!',
      bio: 'Automated creator smoke account',
      location: 'London, UK',
    };
    const businessSignupPayload = {
      organizationName: `Smoke Business ${nonce}`,
      email: `smoke.business.${nonce}@plxyground.local`,
      password: 'Password1!',
      bio: 'Automated business smoke account',
      location: 'Manchester, UK',
    };

    let creatorToken;
    let businessToken;
    let creatorPostId;
    let businessPostId;
    let opportunityId;

    results.push(await expectJson('ST-API-004 creator signup', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creatorSignupPayload),
      });
      if (response.status !== 201 || !data.token) throw new Error(data.error || 'Creator signup failed');
      creatorToken = data.token;
      return data.user.email;
    }));

    results.push(await expectJson('ST-API-003 creator login', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: creatorSignupPayload.email,
          password: creatorSignupPayload.password,
        }),
      });
      if (!response.ok || !data.token) throw new Error(data.error || 'Creator login failed');
      creatorToken = data.token;
      return data.user.email;
    }));

    results.push(await expectJson('ST-API-006 business signup', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/business/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessSignupPayload),
      });
      if (response.status !== 201 || !data.token) throw new Error(data.error || 'Business signup failed');
      businessToken = data.token;
      return data.user.email;
    }));

    results.push(await expectJson('ST-API-005 business login', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/business/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: businessSignupPayload.email,
          password: businessSignupPayload.password,
        }),
      });
      if (!response.ok || !data.token) throw new Error(data.error || 'Business login failed');
      businessToken = data.token;
      return data.user.email;
    }));

    results.push(await expectJson('ST-API-007 feed list', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/content?limit=5`);
      if (!response.ok || !Array.isArray(data.data)) throw new Error('Feed list failed');
      return `items=${data.data.length}`;
    }));

    results.push(await expectJson('ST-API-008 creator content create', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creatorToken}`,
        },
        body: JSON.stringify({
          title: `Creator smoke post ${nonce}`,
          body: 'Created by the automated smoke suite.',
          content_type: 'article',
          media_url: 'https://images.unsplash.com/photo-1546519638405-a9f5a95a5b64?w=800',
        }),
      });
      if (response.status !== 201) throw new Error(data.error || 'Creator content create failed');
      creatorPostId = data.id;
      return `id=${creatorPostId}`;
    }));

    results.push(await expectJson('ST-API-013 business content create', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/business/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${businessToken}`,
        },
        body: JSON.stringify({
          title: `Business smoke post ${nonce}`,
          body: 'Campaign brief for automated smoke coverage.',
          content_type: 'image_story',
          media_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
          campaign_goal: 'Lead generation',
          call_to_action: 'Apply now',
          target_creator_profile: 'Sports creators in the UK',
        }),
      });
      if (response.status !== 201) throw new Error(data.error || 'Business content create failed');
      businessPostId = data.id;
      return `id=${businessPostId}`;
    }));

    results.push(await expectJson('ST-API-014 business content mine', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/business/content/mine`, {
        headers: { Authorization: `Bearer ${businessToken}` },
      });
      const found = Array.isArray(data.data) && data.data.some((item) => item.id === businessPostId && item.call_to_action === 'Apply now');
      if (!response.ok || !found) throw new Error('Business mine feed missing created post');
      return `items=${data.data.length}`;
    }));

    results.push(await expectJson('ST-API-015 business opportunity create stays pending', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${businessToken}`,
        },
        body: JSON.stringify({
          title: `Business smoke opportunity ${nonce}`,
          role_type: 'Sponsored campaign',
          body: 'Need creators for an upcoming launch.',
          requirements: 'Sports audience',
          benefits: 'Paid collaboration',
        }),
      });
      if (response.status !== 201) throw new Error(data.error || 'Opportunity create failed');
      if (data.is_published !== 0) throw new Error('Opportunity was published before admin approval');
      opportunityId = data.id;
      return `id=${opportunityId}`;
    }));

    results.push(await expectJson('ST-API-016 business cannot self-publish opportunity', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${businessToken}`,
        },
        body: JSON.stringify({
          title: `Edited business smoke opportunity ${nonce}`,
          is_published: 1,
        }),
      });
      if (!response.ok) throw new Error(data.error || 'Opportunity update failed');
      if (data.is_published !== 0) throw new Error('Business was able to self-publish opportunity');
      return `id=${data.id}`;
    }));

    results.push(await expectJson('ST-API-009 admin queue unauthorized', async () => {
      const { response } = await requestJson(`${backendUrl}/api/admin/queue`);
      if (response.status !== 401) throw new Error(`Expected 401, received ${response.status}`);
      return '401';
    }));

    let adminToken;
    results.push(await expectJson('ST-API-010 admin login', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@plxyground.local',
          password: 'Internet2026@',
        }),
      });
      if (!response.ok || !data.token) throw new Error(data.error || 'Admin login failed');
      adminToken = data.token;
      return data.user.email;
    }));

    results.push(await expectJson('ST-ADM-003 queue bulk approve', async () => {
      const queueResponse = await requestJson(`${backendUrl}/api/admin/queue`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const targetIds = (queueResponse.data.data || [])
        .filter((item) => item.entity_id === creatorPostId || item.entity_id === businessPostId || item.entity_id === opportunityId)
        .map((item) => item.id);

      if (targetIds.length < 3) throw new Error('Missing moderation queue items for created entities');

      const { response, data } = await requestJson(`${backendUrl}/api/admin/queue/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action: 'approve', ids: targetIds }),
      });
      if (!response.ok) throw new Error(data.error || 'Bulk approve failed');
      return `approved=${targetIds.length}`;
    }));

    results.push(await expectJson('ST-API-017 approved business content is public', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/content/${businessPostId}`);
      if (!response.ok || data.id !== businessPostId) throw new Error('Approved business content is not public');
      return data.title;
    }));

    results.push(await expectJson('ST-API-018 approved opportunity is public', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/opportunities/${opportunityId}`);
      if (!response.ok || data.id !== opportunityId) throw new Error('Approved opportunity is not public');
      return data.title;
    }));

    results.push(await expectJson('ST-API-019 creator can apply to approved opportunity', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creatorToken}`,
        },
        body: JSON.stringify({ message: 'Interested in this campaign.' }),
      });
      if (response.status !== 201) throw new Error(data.error || 'Creator application failed');
      return `application=${data.applicationId}`;
    }));

    results.push(await expectJson('ST-API-011 admin analytics', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok || !data.kpis) throw new Error('Analytics failed');
      return `totalContent=${data.kpis.totalContent}`;
    }));

    results.push(await expectJson('ST-API-012 admin alerts', async () => {
      const { response, data } = await requestJson(`${backendUrl}/api/admin/alerts`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok || !Array.isArray(data.data)) throw new Error('Alerts failed');
      return `items=${data.data.length}`;
    }));

    results.push(await expectJson('ST-ADM-001 admin panel', async () => {
      const response = await fetch(adminUrl);
      if (!response.ok) throw new Error(`Admin panel responded ${response.status}`);
      return `${response.status}`;
    }));
  } finally {
    backendProcess.kill();
    adminProcess.kill();
  }

  const failed = results.filter((result) => result.status === 'FAIL');
  for (const result of results) {
    process.stdout.write(`${result.name} | ${result.status} | ${result.detail}\n`);
  }

  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
