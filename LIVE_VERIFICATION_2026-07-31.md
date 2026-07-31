# Live verification — 2026-07-31

Dollar Data Context Guard was verified end to end against a real local DataHub Core instance using only synthetic competition metadata.

## Runtime

- DataHub Core: `v1.6.0` official stable Docker Quickstart
- DataHub CLI: `1.6.0.16` on an isolated Python `3.11.15` runtime
- Docker Desktop: `4.84.0`
- MCP server: official `uvx mcp-server-datahub@latest`
- GMS: `http://127.0.0.1:8080`, health response `200 OK`
- Frontend: `http://127.0.0.1:9002`, response `200 OK`

## Verified MCP tools

- `search`
- `get_entities`
- `list_schema_fields`
- `get_lineage`

Mutation tools remained disabled. The validation path was read-only after the synthetic seed step.

## Synthetic catalog evidence

The seed script created `commerce.customer_profile` with:

- environment `PROD`;
- dataset and field tag `PII`;
- synthetic owner `Data Platform Demo Owner`;
- affected field `email VARCHAR`;
- three downstream assets across lineage degrees 1, 2, and 3.

## Decision evidence

Running:

```powershell
$env:DATAHUB_GMS_URL = 'http://127.0.0.1:8080'
$env:DATAHUB_GMS_TOKEN = 'local-auth-disabled-placeholder'
node src/live-cli.mjs --intent examples/intent.json
```

returned:

- mode: `mcp-live`;
- risk: `extreme`;
- decision: `block_pending_owner_approval`;
- downstream count: `3`;
- sensitive tag: `PII`.

The placeholder token is not a credential. The local Quickstart reports `METADATA_SERVICE_AUTH_ENABLED=false`; the variable is present only because the self-hosted MCP process requires a non-empty configuration value.

## Automated validation

`npm.cmd test` passed 10 tests, including official MCP response normalization, three-hop lineage normalization, error propagation, deterministic policy behavior, redaction, and fail-closed write-back.
