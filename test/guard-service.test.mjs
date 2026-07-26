import assert from 'node:assert/strict';
import test from 'node:test';
import { DataContextGuard } from '../src/guard-service.mjs';
import { scenarioById } from '../src/fixtures/scenarios.mjs';
import { FixtureDataHubClient } from '../src/mcp/fixture-datahub-client.mjs';

test('creates an explainable DataHub context verdict', async () => {
  const guard = new DataContextGuard(new FixtureDataHubClient(), { now: () => '2026-07-26T00:00:00.000Z' });
  const decision = await guard.analyze(scenarioById('destructive-customer-email').intent);

  assert.equal(decision.mode, 'fixture');
  assert.equal(decision.policy.level, 'extreme');
  assert.equal(decision.asset.name, 'commerce.customer_profile');
  assert.equal(decision.lineage.downstream.length, 3);
  assert.deepEqual(decision.affectedFields.map((field) => field.name), ['email']);
  assert.equal(decision.privacy.neverSent.includes('source files'), true);
});

test('holds when an asset cannot be resolved', async () => {
  const guard = new DataContextGuard(new FixtureDataHubClient());
  const decision = await guard.analyze({
    assetQuery: 'does.not.exist',
    operation: 'drop a column',
    environment: 'PROD'
  });
  assert.equal(decision.status, 'asset_not_found');
});

test('never writes back without an explicit human approval', async () => {
  const client = new FixtureDataHubClient();
  const guard = new DataContextGuard(client);
  const decision = await guard.analyze(scenarioById('safe-product-description').intent);
  await assert.rejects(() => guard.writeBack(decision), /explicit human approval/i);
  assert.equal(client.writes.length, 0);
});

