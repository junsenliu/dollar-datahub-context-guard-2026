import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyChange, saferActionFor } from '../src/policy-engine.mjs';

test('blocks destructive production changes to PII with lineage', () => {
  const policy = classifyChange({
    intent: { operation: 'drop the email column', environment: 'PROD', fields: ['email'] },
    entity: { tags: ['PII'] },
    lineage: { downstream: [{ urn: 'a' }] }
  });
  assert.equal(policy.level, 'extreme');
  assert.equal(policy.decision, 'block_pending_owner_approval');
  assert.match(saferActionFor(policy), /non-production preview/i);
});

test('allows a harmless metadata change with an audit record', () => {
  const policy = classifyChange({
    intent: { operation: 'update documentation', environment: 'PROD', fields: [] },
    entity: { tags: ['Internal'] },
    lineage: { downstream: [] }
  });
  assert.equal(policy.level, 'low');
  assert.equal(policy.decision, 'allow_with_audit');
});

