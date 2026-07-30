# Live DataHub MCP checklist

The fixture demo is intentionally reproducible without infrastructure. Complete this validation before representing the live MCP path as demonstrated.

## Prerequisites

- An authorized DataHub OSS or DataHub Cloud environment.
- The official server runnable with `uvx mcp-server-datahub@latest`.
- A DataHub endpoint and least-privilege token kept only in the current shell or a local ignored file.
- A harmless, non-production test asset with known owner, schema, and lineage.

## Run

```powershell
$env:DCG_MODE = 'mcp'
$env:DATAHUB_GMS_URL = 'http://localhost:8080'
$env:DATAHUB_GMS_TOKEN = '<least-privilege-token>'
$env:DATAHUB_MCP_COMMAND = 'uvx.exe'
$env:DATAHUB_MCP_ARGS = '["mcp-server-datahub@latest"]'
node src/cli.mjs --inspect-mcp --mcp
node src/cli.mjs --intent .\examples\intent.json --mcp
```

## Accept only when

- The server lists its live tools successfully.
- DCG resolves the designated test asset and receives entity, schema, and lineage data.
- No secret value appears in terminal output, artifacts, screenshots, or repository history.
- A rejected or unresolved lookup causes no write operation.
- A recording labels the catalog as synthetic unless this exact live flow was captured.

## Local infrastructure note

On this Windows PC, Docker-based DataHub Quickstart is blocked only by firmware virtualization. Enable Intel Virtualization Technology (VT-x) in BIOS/UEFI, boot Windows, verify `wsl --status`, then install/start Docker Desktop before running the official DataHub Quickstart. Rebooting alone cannot enable firmware virtualization.
