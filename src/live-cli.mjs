import { readFile } from 'node:fs/promises';
import { DataContextGuard } from './guard-service.mjs';
import { LiveMcpDataHubClient } from './mcp/live-mcp-datahub-client.mjs';

const args = process.argv.slice(2);
const pathIndex = args.indexOf('--intent');
if (pathIndex === -1 || !args[pathIndex + 1]) {
  throw new Error('Use --intent <path-to-json>.');
}

const intent = JSON.parse(await readFile(args[pathIndex + 1], 'utf8'));
const client = new LiveMcpDataHubClient();
try {
  const guard = new DataContextGuard(client);
  console.log(JSON.stringify(await guard.analyze(intent), null, 2));
} finally {
  await client.close();
}
