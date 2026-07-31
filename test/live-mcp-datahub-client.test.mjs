import assert from 'node:assert/strict';
import test from 'node:test';
import {
  entityFromPayload,
  lineageFromPayload,
  parseToolPayload
} from '../src/mcp/live-mcp-datahub-client.mjs';

const urn = 'urn:li:dataset:(urn:li:dataPlatform:snowflake,commerce.customer_profile,PROD)';

test('normalizes official get_entities object-shaped metadata', () => {
  const entity = entityFromPayload([{
    urn,
    name: 'commerce.customer_profile',
    platform: { name: 'snowflake' },
    properties: { description: 'Synthetic profile' },
    ownership: { owners: [{ owner: { properties: { displayName: 'Demo Owner' } } }] },
    tags: { tags: [{ tag: { properties: { name: 'PII' } } }] },
    schemaMetadata: { fields: [{ fieldPath: 'email', nativeDataType: 'VARCHAR' }] }
  }], urn);
  assert.equal(entity.platform, 'snowflake');
  assert.equal(entity.environment, 'PROD');
  assert.deepEqual(entity.tags, ['PII']);
  assert.deepEqual(entity.owners, ['Demo Owner']);
  assert.equal(entity.schema[0].fieldPath, 'email');
});

test('normalizes official three-hop downstream lineage results', () => {
  const lineage = lineageFromPayload({
    downstreams: {
      searchResults: [{ entity: { urn: 'downstream', name: 'customer_360', type: 'DATASET' }, degree: 2 }]
    }
  });
  assert.deepEqual(lineage.downstream[0], {
    urn: 'downstream',
    name: 'customer_360',
    type: 'DATASET',
    hops: 2
  });
});

test('surfaces MCP tool errors instead of treating them as metadata', () => {
  assert.throws(
    () => parseToolPayload({ isError: true, content: [{ type: 'text', text: 'invalid parameter' }] }),
    /invalid parameter/
  );
});
