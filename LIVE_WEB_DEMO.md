# Live Web Demo

This judge path runs Dollar Data Context Guard against a real local DataHub Core catalog through the official read-only DataHub MCP server. The seeded metadata is synthetic and clearly labelled for demonstration.

## Prerequisites

- Node.js 20 or newer
- Docker Desktop with the DataHub Quickstart running
- DataHub GMS at `http://127.0.0.1:8080`

The local Quickstart used for verification has metadata-service authentication disabled. The token value below is therefore an explicit non-secret placeholder required only because the MCP process expects the environment variable to exist.

## Start the live judge UI

```powershell
$env:DATAHUB_GMS_URL = 'http://127.0.0.1:8080'
$env:DATAHUB_GMS_TOKEN = 'local-auth-disabled-placeholder'
node .\src\live-web-server.mjs
```

Open `http://127.0.0.1:4311`, select **Drop the production email field**, and click **Analyze intent**.

Expected evidence:

- Header: `Live DataHub MCP · Read-only mode`
- Asset: `commerce.customer_profile`
- Environment: `PROD`
- Classifications: `PII`, `Tier1`
- Affected field: `email`
- Owner: `Data Platform Demo Owner`
- Three downstream lineage hops
- Local verdict: `EXTREME — block pending owner approval`

## Safety boundary

The MCP integration exposes only DataHub read tools. Dollar does not write back to DataHub, and the deterministic local policy—not a language model—produces the final decision. Source files, API keys, secret values, and full agent transcripts are not sent to DataHub.

## Verification record

See [`LIVE_VERIFICATION_2026-07-31.md`](./LIVE_VERIFICATION_2026-07-31.md) for the tested DataHub, CLI, MCP, and application versions.
