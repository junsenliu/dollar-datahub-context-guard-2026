import { readFile } from 'node:fs/promises';
import { DataContextGuard } from './guard-service.mjs';
import { FixtureDataHubClient } from './mcp/fixture-datahub-client.mjs';
import { McpDataHubClient } from './mcp/mcp-datahub-client.mjs';
import { scenarioById } from './fixtures/scenarios.mjs';

const args = process.argv.slice(2);
const argument = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
};

async function resolveIntent() {
  const scenario = argument('--scenario');
  if (scenario) {
    const match = scenarioById(scenario);
    if (!match) throw new Error(`Unknown scenario: ${scenario}`);
    return match.intent;
  }
  const path = argument('--intent');
  if (path) return JSON.parse(await readFile(path, 'utf8'));
  throw new Error('Use --scenario <id> or --intent <path-to-json>.');
}

const useMcp = args.includes('--mcp') || process.env.DCG_MODE === 'mcp';
const client = useMcp ? new McpDataHubClient({ allowWriteBack: args.includes('--write-back') }) : new FixtureDataHubClient();

try {
  if (args.includes('--inspect-mcp')) {
    if (!useMcp) throw new Error('Use --inspect-mcp --mcp after configuring DataHub MCP credentials.');
    console.log(JSON.stringify(await client.inspectTools(), null, 2));
  } else {
    const guard = new DataContextGuard(client);
    const decision = await guard.analyze(await resolveIntent());
    console.log(JSON.stringify(decision, null, 2));
  }
} finally {
  await client.close?.();
}

