'use strict';

const http = require('http');
const os = require('os');

const PORT = parseInt(process.env.PORT || '8080', 10);
const APP_VERSION = process.env.APP_VERSION || 'dev';
const GIT_SHA = process.env.GIT_SHA || 'local';
const BUILD_TIME = process.env.BUILD_TIME || 'unknown';
const ENVIRONMENT = process.env.ENVIRONMENT || 'local';

const startedAt = Date.now();

// Readiness is decoupled from liveness on purpose: during SIGTERM we fail
// readiness first so the GKE load balancer stops sending new traffic while
// in-flight requests finish. This is what makes rolling updates zero-downtime.
let ready = true;

function info() {
  return {
    app: 'gke-cicd-demo',
    version: APP_VERSION,
    gitSha: GIT_SHA,
    buildTime: BUILD_TIME,
    environment: ENVIRONMENT,
    instance: os.hostname(),
    nodeVersion: process.version,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    servedAt: new Date().toISOString(),
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function page(data) {
  const rows = [
    ['Version', data.version],
    ['Git commit', data.gitSha],
    ['Built at', data.buildTime],
    ['Environment', data.environment],
    ['Serving pod', data.instance],
    ['Runtime', data.nodeVersion],
    ['Pod uptime', `${data.uptimeSeconds}s`],
  ]
    .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
    .join('\n      ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GKE CI/CD demo &middot; ${escapeHtml(data.gitSha)}</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      background: #0b1220; color: #e6edf7;
    }
    main { width: min(680px, 92vw); padding: 2rem; border: 1px solid #23304a; border-radius: 10px; background: #111a2e; }
    h1 { margin: 0 0 .25rem; font-size: 1.15rem; letter-spacing: .02em; }
    p.sub { margin: 0 0 1.5rem; color: #8ea2c0; font-size: .8rem; }
    table { width: 100%; border-collapse: collapse; font-size: .85rem; }
    th, td { text-align: left; padding: .5rem .25rem; border-bottom: 1px solid #1e2a42; }
    th { color: #8ea2c0; font-weight: 400; width: 40%; }
    td { color: #cfe0f7; word-break: break-all; }
    footer { margin-top: 1.25rem; font-size: .75rem; color: #6f83a0; }
    code { color: #7ee0b8; }
  </style>
</head>
<body>
  <main>
    <h1>Continuous delivery to GKE &mdash; live</h1>
    <p class="sub">This page is rendered by the container image that Cloud Build produced from the last commit.</p>
    <table>
      ${rows}
    </table>
    <footer>
      Machine-readable view: <code>/api/info</code> &middot; probes: <code>/healthz</code>, <code>/readyz</code>
    </footer>
  </main>
</body>
</html>`;
}

function send(res, status, body, contentType) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Served-By': os.hostname(),
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, JSON.stringify({ error: 'method not allowed' }), 'application/json');
  }

  switch (path) {
    case '/':
      return send(res, 200, page(info()), 'text/html; charset=utf-8');
    case '/api/info':
      return send(res, 200, JSON.stringify(info(), null, 2), 'application/json');
    case '/healthz':
      // Liveness: the process is alive and the event loop responds.
      return send(res, 200, JSON.stringify({ status: 'ok' }), 'application/json');
    case '/readyz':
      return ready
        ? send(res, 200, JSON.stringify({ status: 'ready' }), 'application/json')
        : send(res, 503, JSON.stringify({ status: 'draining' }), 'application/json');
    default:
      return send(res, 404, JSON.stringify({ error: 'not found', path }), 'application/json');
  }
});

server.listen(PORT, () => {
  console.log(JSON.stringify({
    severity: 'INFO',
    message: `listening on :${PORT}`,
    version: APP_VERSION,
    gitSha: GIT_SHA,
    instance: os.hostname(),
  }));
});

function shutdown(signal) {
  console.log(JSON.stringify({ severity: 'INFO', message: `${signal} received, draining` }));
  ready = false;
  // Keep serving for a few seconds so the GKE endpoint is removed from the
  // load balancer before the listener closes.
  setTimeout(() => {
    server.close(() => {
      console.log(JSON.stringify({ severity: 'INFO', message: 'closed, exiting' }));
      process.exit(0);
    });
  }, 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
