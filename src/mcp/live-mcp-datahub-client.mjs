import { McpStdioClient } from './mcp-stdio-client.mjs';

export function parseToolPayload(result) {
  const texts = (result.content ?? [])
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .filter(Boolean);
  if (result.isError) {
    throw new Error(`DataHub MCP tool failed: ${texts.join('\n') || 'Unknown MCP error'}`);
  }
  for (const value of texts) {
    try {
      return JSON.parse(value);
    } catch {
      // Fall through to structuredContent for non-JSON diagnostics.
    }
  }
  return result.structuredContent?.result ?? result.structuredContent ?? { rawText: texts.join('\n') };
}

function firstEntity(payload) {
  const candidates = payload.entities ?? payload.results ?? payload.searchResults ?? payload.data?.entities ?? [];
  const result = Array.isArray(candidates) ? candidates[0] : undefined;
  const entity = result?.entity ?? result;
  if (!entity) return null;
  return {
    urn: entity.urn,
    name: entity.name ?? entity.properties?.name ?? entity.urn,
    type: entity.type ?? 'dataset'
  };
}

function environmentFromUrn(urn) {
  return typeof urn === 'string' ? urn.match(/,([^,()]+)\)$/)?.[1] ?? 'unknown' : 'unknown';
}

function tagName(value) {
  const tag = value?.tag ?? value;
  return tag?.properties?.name ?? tag?.name ?? tag?.urn?.split(':').at(-1) ?? tag;
}

function ownerName(value) {
  const owner = value?.owner ?? value;
  return owner?.properties?.displayName
    ?? owner?.properties?.email
    ?? owner?.username
    ?? owner?.name
    ?? owner?.urn
    ?? owner;
}

export function entityFromPayload(payload, urn) {
  const candidates = payload.entities ?? payload.results ?? payload.data?.entities ?? payload;
  const entity = Array.isArray(candidates) ? candidates[0] : candidates[urn] ?? candidates;
  const tags = Array.isArray(entity.tags) ? entity.tags : entity.tags?.tags ?? entity.globalTags?.tags ?? [];
  const owners = Array.isArray(entity.owners) ? entity.owners : entity.ownership?.owners ?? [];
  return {
    urn: entity.urn ?? urn,
    name: entity.name ?? entity.properties?.name ?? urn,
    platform: typeof entity.platform === 'string' ? entity.platform : entity.platform?.name ?? 'unknown',
    environment: entity.environment ?? entity.env ?? environmentFromUrn(entity.urn ?? urn),
    description: entity.description ?? entity.properties?.description ?? '',
    tags: tags.map(tagName),
    owners: owners.map(ownerName),
    schema: entity.schema ?? entity.schemaMetadata?.fields ?? []
  };
}

export function lineageFromPayload(payload) {
  const searchResults = payload.downstreams?.searchResults
    ?? payload.downstream?.searchResults
    ?? payload.searchResults
    ?? payload.entities
    ?? payload.lineage
    ?? [];
  return {
    downstream: searchResults.map((result) => {
      const entity = result.entity ?? result;
      return {
        urn: entity.urn,
        name: entity.name ?? entity.properties?.name ?? entity.urn,
        type: entity.type ?? 'dataset',
        hops: result.degree ?? result.hops ?? 1
      };
    })
  };
}

export class LiveMcpDataHubClient {
  constructor({ command, args, env = process.env } = {}) {
    const defaultCommand = process.platform === 'win32' ? 'uvx.exe' : 'uvx';
    const parsedArgs = args ?? JSON.parse(env.DATAHUB_MCP_ARGS ?? '["mcp-server-datahub@latest"]');
    this.rpc = new McpStdioClient({
      command: command ?? env.DATAHUB_MCP_COMMAND ?? defaultCommand,
      args: parsedArgs,
      env
    });
    this.mode = 'mcp-live';
  }

  async inspectTools() {
    return this.rpc.listTools();
  }

  async findAsset(query) {
    const normalized = query.startsWith('/q') ? query : `/q ${query}`;
    return firstEntity(parseToolPayload(await this.rpc.callTool('search', { query: normalized })));
  }

  async getEntity(urn) {
    return entityFromPayload(
      parseToolPayload(await this.rpc.callTool('get_entities', { urns: [urn] })),
      urn
    );
  }

  async listSchemaFields(urn) {
    const payload = parseToolPayload(await this.rpc.callTool('list_schema_fields', { urn }));
    return payload.fields ?? payload.schemaFields ?? payload.schema ?? [];
  }

  async getLineage(urn) {
    const payload = parseToolPayload(await this.rpc.callTool('get_lineage', {
      urn,
      upstream: false,
      max_hops: 3,
      max_results: 30
    }));
    return lineageFromPayload(payload);
  }

  async writeDecision() {
    throw new Error('Live competition verification is read-only; write-back is disabled.');
  }

  close() {
    return this.rpc.close();
  }
}
