'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 8181;
const BASE = `http://127.0.0.1:${PORT}`;
let child;

async function waitForReady(timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/healthz`);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not become healthy in time');
}

before(async () => {
  child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(PORT), GIT_SHA: 'testsha', APP_VERSION: '0.0.0-test' },
    stdio: 'ignore',
  });
  await waitForReady();
});

after(() => {
  if (child) child.kill('SIGKILL');
});

test('GET / returns the HTML status page with the build metadata', async () => {
  const res = await fetch(`${BASE}/`);
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const body = await res.text();
  assert.match(body, /testsha/);
});

test('GET /api/info returns machine-readable build metadata', async () => {
  const res = await fetch(`${BASE}/api/info`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.gitSha, 'testsha');
  assert.strictEqual(body.version, '0.0.0-test');
  assert.ok(body.instance.length > 0);
});

test('probes answer independently', async () => {
  const health = await fetch(`${BASE}/healthz`);
  const readiness = await fetch(`${BASE}/readyz`);
  assert.strictEqual(health.status, 200);
  assert.strictEqual(readiness.status, 200);
});

test('unknown paths return 404 JSON', async () => {
  const res = await fetch(`${BASE}/does-not-exist`);
  assert.strictEqual(res.status, 404);
  assert.strictEqual((await res.json()).error, 'not found');
});

test('non-GET methods are rejected', async () => {
  const res = await fetch(`${BASE}/`, { method: 'POST' });
  assert.strictEqual(res.status, 405);
});
