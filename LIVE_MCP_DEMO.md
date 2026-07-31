# Live DataHub MCP demo

This path connects the project to a real local DataHub Core v1.6.0 instance through the official `mcp-server-datahub` package. The catalog is populated only with clearly labelled synthetic competition metadata.

```powershell
$env:DATAHUB_GMS_URL = 'http://127.0.0.1:8080'
$env:DATAHUB_GMS_TOKEN = 'local-auth-disabled-placeholder'
node src/live-cli.mjs --intent examples/intent.json
```

Expected evidence:

- `mode` is `mcp-live`;
- the resolved asset is `commerce.customer_profile` in `PROD`;
- the asset and `email` field are tagged `PII`;
- three downstream assets are returned across three lineage hops;
- the deterministic result is `EXTREME` and remains blocked pending owner approval.

The placeholder token is not a credential. DataHub Quickstart has `METADATA_SERVICE_AUTH_ENABLED=false`; the value exists only because the self-hosted MCP server requires the environment variable to be present.
