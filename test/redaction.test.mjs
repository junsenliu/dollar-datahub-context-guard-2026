import assert from 'node:assert/strict';
import test from 'node:test';
import { redactIntent, redactText } from '../src/redaction.mjs';

test('redacts tokens, credentials, and home directories', () => {
  const input = 'token=sk-1234567890abcdefghijkl C:\\Users\\alice\\project password=hunter2';
  const result = redactText(input);
  assert.match(result, /\[REDACTED\]/);
  assert.ok(!result.includes('hunter2'));
  assert.ok(!result.includes('alice'));
});

test('minimizes only intended change fields', () => {
  const intent = redactIntent({
    assetQuery: 'commerce.customer_profile',
    operation: 'drop email',
    fields: ['email'],
    ignored: 'not forwarded'
  });
  assert.deepEqual(Object.keys(intent).sort(), ['assetQuery', 'environment', 'fields', 'operation', 'rationale', 'requestedBy']);
  assert.deepEqual(intent.fields, ['email']);
});

