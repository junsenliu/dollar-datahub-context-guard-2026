# DataHub hackathon feedback draft

## Topic

Make the MCP quickstart's runtime prerequisites and configuration contract more discoverable for Windows developers.

## Observed friction

The official `uvx mcp-server-datahub@latest` command is straightforward once known, but a new Windows user has to bridge several separate concepts: installing `uv`, configuring `~/.datahubenv` or `DATAHUB_GMS_URL`/token, and (for the local Quickstart route) enabling WSL2/Docker virtualization in firmware. When the server has no configuration, the error names `~/.datahubenv` but does not give a short cross-platform next step or a safe minimal test configuration.

## Suggested improvement

1. Include `uvx mcp-server-datahub@latest --help` as a zero-credential installation check.
2. Show the two supported configuration options: `~/.datahubenv` and environment variables.
3. Provide a read-only "list tools" command before users try a mutation.
4. Add a Windows note that Docker Quickstart requires WSL2 and BIOS/UEFI virtualization enabled.
5. Include a least-privilege configuration example with placeholders only.

This would reduce setup failure while reinforcing read-only validation and credential hygiene for agent developers.
