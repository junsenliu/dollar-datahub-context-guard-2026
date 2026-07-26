import { classifyChange, saferActionFor } from './policy-engine.mjs';
import { redactIntent } from './redaction.mjs';

function assertIntent(intent) {
  if (!intent || typeof intent !== 'object') throw new Error('A change intent object is required.');
  if (!intent.assetQuery?.trim()) throw new Error('Change intent must include assetQuery.');
  if (!intent.operation?.trim()) throw new Error('Change intent must include operation.');
}

function normalizeField(field) {
  return {
    name: field.name ?? field.fieldPath ?? field.path ?? 'unknown',
    type: field.type ?? field.nativeDataType ?? 'unknown',
    tags: field.tags ?? []
  };
}

export class DataContextGuard {
  constructor(datahubClient, { now = () => new Date().toISOString() } = {}) {
    this.datahub = datahubClient;
    this.now = now;
  }

  async analyze(intent) {
    assertIntent(intent);
    const minimizedIntent = redactIntent(intent);
    const asset = await this.datahub.findAsset(minimizedIntent.assetQuery);
    if (!asset?.urn) {
      return {
        status: 'asset_not_found',
        mode: this.datahub.mode,
        intent: minimizedIntent,
        message: 'Dollar could not resolve the requested data asset in DataHub. No write is permitted until an owner supplies an exact asset identifier.'
      };
    }

    const [entity, schema, lineage] = await Promise.all([
      this.datahub.getEntity(asset.urn),
      this.datahub.listSchemaFields(asset.urn),
      this.datahub.getLineage(asset.urn)
    ]);

    const requestedFields = new Set(minimizedIntent.fields.map((field) => field.toLowerCase()));
    const affectedFields = schema
      .map(normalizeField)
      .filter((field) => requestedFields.size === 0 || requestedFields.has(field.name.toLowerCase()));
    const policy = classifyChange({ intent: minimizedIntent, entity, lineage });

    const decision = {
      id: `dcg-${Date.now().toString(36)}`,
      generatedAt: this.now(),
      status: 'analyzed',
      mode: this.datahub.mode,
      intent: minimizedIntent,
      asset: {
        urn: entity.urn,
        name: entity.name,
        platform: entity.platform,
        environment: entity.environment,
        tags: entity.tags ?? [],
        owners: entity.owners ?? []
      },
      affectedFields,
      lineage: {
        downstream: lineage.downstream ?? []
      },
      policy,
      recommendation: saferActionFor(policy),
      privacy: {
        sentToDataHub: ['asset query', 'asset URN', 'metadata lookup parameters'],
        neverSent: ['source files', 'API keys', 'secret values', 'complete agent transcripts']
      }
    };

    return decision;
  }

  async writeBack(decision, { approvedByHuman = false } = {}) {
    if (!approvedByHuman) {
      throw new Error('Write-back requires an explicit human approval.');
    }
    return this.datahub.writeDecision(decision);
  }
}

