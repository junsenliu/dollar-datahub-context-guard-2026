import { McpStdioClient } from './mcp-stdio-client.mjs';

function parseToolPayload(result) {
  const texts = (result.content ?? [])
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .filter(Boolean);

  for (const text of texts) {
    try {
      return JSON.parse(text);
    } catch {
      // The MCP server may return explanatory Markdown; retain it as raw context.
    }
  }
  return result.structuredContent ?? { rawText: texts.join('\n') };
}

function firstEntity(payload) {
  const candidates = payload.entities ?? payload.results ?? payload.searchResults ?? payload.data?.entities ?? [];
  const entity = Array.isArray(candidates) ? candidates[0] : undefined;
  if (!entity) return null;
  return {
    urn: entity.urn ?? entity.entity?.urn,
    name: entity.name ?? entity.entity?.name ?? entity.displayName ?? entity.urn,
    type: entity.type ?? entity.entity?.type ?? 'dataset'
  };
}

function entityFromPayload(payload, urn) {
  const candidates = payload.entities ?? payload.results ?? payload.data?.entities ?? payload;
  const entity = Array.isArray(candidates) ? candidates[0] : candidates[urn] ?? candidates;
  return {
    urn: entity.urn ?? urn,
    name: entity.name ?? entity.properties?.name ?? urn,
    platform: entity.platform ?? entity.platform?.name ?? 'unknown',
    environment: entity.environment ?? 'unknown',
    description: entity.description ?? entity.properties?.description ?? '',
    tags: (entity.tags ?? entity.globalTags?.tags ?? []).map((tag) => tag.name ?? tag.tag ?? tag),
    owners: (entity.owners ?? []).map((owner) => owner.username ?? owner.name ?? owner),
    schema: entity.schema ?? entity.schemaMetadata?.fields ?? []
  };
}

/**
 * Production adapter. It uses the official DataHub MCP tools at runtime.
 * The method names map directly to the official server's search, get_entities,
 * list_schema_fields and get_lineage tools. Tool payloads remain inspectable.
 */
export class McpDataHubClient {
  constructor({ command, args, env = process.env, allowWriteBack = false } = {}) {
    const defaultCommand = process.platform === 'win32' ? 'uvx.exe' : 'uvx';
    const parsedArgs = args ?? JSON.parse(env.DATAHUB_MCP_ARGS ?? '["mcp-server-datahub@latest"]');
    this.rpc = new McpStdioClient({ command: command ?? env.DATAHUB_MCP_COMMAND ?? defaultCommand, args: parsedArgs, env });
    this.allowWriteBack = allowWriteBack;
    this.mode = 'mcp';
  }

  async inspectTools() {
    return this.rpc.listTools();
  }

  async findAsset(query) {
    return firstEntity(parseToolPayload(await this.rpc.callTool('search', { query })));
  }

  async getEntity(urn) {
    return entityFromPayload(parseToolPayload(await this.rpc.callTool('get_entities', { urns: [urn] })), urn);
  }

  async listSchemaFields(urn) {
    const payload = parseToolPayload(await this.rpc.callTool('list_schema_fields', { urn }));
    return payload.fields ?? payload.schemaFields ?? payload.schema ?? [];
  }

  async getLineage(urn) {
    const payload = parseToolPayload(await this.rpc.callTool('get_lineage', {
      urn,
      direction: 'DOWNSTREAM',
      maxHops: 3
    }));
    return { downstream: payload.downstream ?? payload.entities ?? payload.lineage ?? [] };
  }

  async writeDecision(record) {
    if (!this.allowWriteBack) {
      throw new Error('DataHub write-back is disabled. Re-run with an explicit --write-back approval.');
    }
    return this.rpc.callTool('save_document', {
      title: `Dollar Context Guard decision: ${record.asset.name}`,
      content: JSON.stringify(record, null, 2)
    });
  }

  close() {
    return this.rpc.close();
  }
}
