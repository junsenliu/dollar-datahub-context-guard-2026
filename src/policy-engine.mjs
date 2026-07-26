const SENSITIVE_TAGS = new Set(['PII', 'PHI', 'PCI', 'Confidential', 'Restricted']);
const DESTRUCTIVE = /\b(drop|delete|remove|truncate|replace|overwrite|rebuild)\b/i;
const SCHEMA_CHANGING = /\b(rename|alter|migrate|change type|backfill)\b/i;

export function classifyChange({ intent, entity, lineage }) {
  const tags = new Set((entity.tags ?? []).map((tag) => String(tag).toUpperCase()));
  const sensitiveTags = [...tags].filter((tag) => SENSITIVE_TAGS.has(tag));
  const downstreamCount = lineage.downstream?.length ?? 0;
  const isDestructive = DESTRUCTIVE.test(intent.operation ?? '');
  const changesSchema = SCHEMA_CHANGING.test(intent.operation ?? '') || (intent.fields?.length ?? 0) > 0;
  const isProduction = String(intent.environment).toUpperCase() === 'PROD';

  let level = 'low';
  let decision = 'allow_with_audit';
  const reasons = [];

  if (isProduction) reasons.push('The requested operation targets production metadata.');
  if (changesSchema) reasons.push('The requested operation changes a schema or field contract.');
  if (downstreamCount > 0) reasons.push(`${downstreamCount} downstream asset${downstreamCount === 1 ? '' : 's'} depend on this asset.`);
  if (sensitiveTags.length > 0) reasons.push(`DataHub classifies this asset as ${sensitiveTags.join(', ')}.`);

  if (isDestructive && isProduction && sensitiveTags.length > 0) {
    level = 'extreme';
    decision = 'block_pending_owner_approval';
  } else if (isDestructive && (downstreamCount > 0 || isProduction)) {
    level = 'high';
    decision = 'require_owner_approval';
  } else if (changesSchema && (downstreamCount > 0 || sensitiveTags.length > 0)) {
    level = 'medium';
    decision = 'require_review';
  }

  return {
    level,
    decision,
    reasons,
    evidence: {
      isDestructive,
      changesSchema,
      isProduction,
      sensitiveTags,
      downstreamCount
    }
  };
}

export function saferActionFor(policy) {
  if (policy.level === 'extreme') {
    return 'Create a non-production preview, notify the listed owners, and require a separate human approval before any write.';
  }
  if (policy.level === 'high') {
    return 'Generate an impact report, obtain owner approval, and run the change first against a reversible staging copy.';
  }
  if (policy.level === 'medium') {
    return 'Review the lineage and field contract with the data owner before applying the change.';
  }
  return 'Record the change intent and continue with the standard change-management process.';
}

