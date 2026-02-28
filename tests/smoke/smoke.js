#!/usr/bin/env node
/**
 * Post-deploy smoke test.
 * Usage: node tests/smoke/smoke.js [BASE_URL]
 * Example: node tests/smoke/smoke.js https://vetai24.ru
 */

const BASE = process.argv[2] || process.env.APP_URL || 'https://vetai24.ru';
let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { res, body: await res.json().catch(() => null) };
}

async function post(path, data) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return { res, body: await res.json().catch(() => null) };
}

console.log(`\nSmoke tests → ${BASE}\n`);

await check('GET /api/health → 200 + status:ok', async () => {
  const { res, body } = await get('/api/health');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(body?.status === 'ok', `Expected status:ok, got ${JSON.stringify(body)}`);
});

await check('GET /api/health → has services object', async () => {
  const { body } = await get('/api/health');
  assert(body?.services && typeof body.services === 'object', 'Missing services object');
});

await check('POST /api/auth/login with missing fields → 400', async () => {
  const { res } = await post('/api/auth/login', { email: 'x@x.com' });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

await check('POST /api/auth/login with wrong credentials → 401', async () => {
  const { res } = await post('/api/auth/login', {
    email: 'smoke-test-nonexistent@example.com',
    password: 'wrong-password-123',
  });
  assert(res.status === 401, `Expected 401, got ${res.status}`);
});

await check('GET /api/widget/nonexistent-slug/config → 404', async () => {
  const { res } = await get('/api/widget/smoke-test-nonexistent-slug-xyz/config');
  assert(res.status === 404, `Expected 404, got ${res.status}`);
});

await check('GET /api/clinic without auth → 401', async () => {
  const { res } = await get('/api/clinic');
  assert(res.status === 401, `Expected 401, got ${res.status}`);
});

await check('POST /api/auth/reset-password with missing email → 400', async () => {
  const { res } = await post('/api/auth/reset-password', {});
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
