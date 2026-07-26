import { RETAIL_CATALOG } from '../fixtures/retail-catalog.mjs';

export class FixtureDataHubClient {
  constructor(catalog = RETAIL_CATALOG) {
    this.catalog = catalog;
    this.writes = [];
    this.mode = 'fixture';
  }

  async findAsset(query) {
    const needle = String(query).toLowerCase();
    const match = Object.values(this.catalog.entities).find((entity) =>
      entity.name.toLowerCase().includes(needle) || entity.urn.toLowerCase().includes(needle)
    );
    return match ? { urn: match.urn, name: match.name, type: 'dataset' } : null;
  }

  async getEntity(urn) {
    const entity = this.catalog.entities[urn];
    if (!entity) throw new Error(`Fixture catalog has no entity for ${urn}`);
    return structuredClone(entity);
  }

  async listSchemaFields(urn) {
    return (await this.getEntity(urn)).schema;
  }

  async getLineage(urn) {
    return { downstream: structuredClone(this.catalog.downstream[urn] ?? []) };
  }

  async writeDecision(record) {
    this.writes.push(record);
    return { stored: true, destination: 'fixture-memory', id: `fixture-${this.writes.length}` };
  }
}
