import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataContextGuard } from './guard-service.mjs';
import { scenarioById, SCENARIOS } from './fixtures/scenarios.mjs';
import { FixtureDataHubClient } from './mcp/fixture-datahub-client.mjs';
import { McpDataHubClient } from './mcp/mcp-datahub-client.mjs';

const directory = resolve(fileURLToPath(new URL('.', import.meta.url)));
const publicDirectory = resolve(directory, '../public');
const mode = process.env.DCG_MODE === 'mcp' ? 'mcp' : 'fixture';
const datahub = mode === 'mcp' ? new McpDataHubClient() : new FixtureDataHubClient();
const guard = new DataContextGuard(datahub);
const port = Number(process.env.PORT ?? 4310);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(response, status, data) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(data));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error('Request body exceeds 64 KiB.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function serveStatic(pathname, response) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = resolve(publicDirectory, `.${requested}`);
  if (!filePath.startsWith(publicDirectory) || !existsSync(filePath) || !(await stat(filePath)).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
    'cache-control': 'no-store'
  });
  createReadStream(filePath).pipe(response);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (request.method === 'GET' && url.pathname === '/api/status') {
      return sendJson(response, 200, { mode, writeBackEnabled: false, catalog: mode === 'fixture' ? 'synthetic-retail-demo' : 'configured-datahub' });
    }
    if (request.method === 'GET' && url.pathname === '/api/scenarios') {
      return sendJson(response, 200, SCENARIOS.map(({ id, title }) => ({ id, title })));
    }
    if (request.method === 'POST' && url.pathname === '/api/analyze') {
      const body = await readJson(request);
      const intent = body.scenarioId ? scenarioById(body.scenarioId)?.intent : body.intent;
      if (!intent) return sendJson(response, 400, { error: 'Provide a valid scenarioId or intent.' });
      return sendJson(response, 200, await guard.analyze(intent));
    }
    if (request.method === 'GET') return serveStatic(url.pathname, response);
    return sendJson(response, 405, { error: 'Method not allowed.' });
  } catch (error) {
    return sendJson(response, 500, { error: error.message, mode });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Dollar Data Context Guard running at http://127.0.0.1:${port} (${mode} mode)`);
});

async function shutdown() {
  server.close();
  await datahub.close?.();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

