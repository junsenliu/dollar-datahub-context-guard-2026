# Judge guide

Repository: https://github.com/junsenliu/dollar-datahub-context-guard-2026

## Fastest reproducible path

```powershell
git clone https://github.com/junsenliu/dollar-datahub-context-guard-2026.git
Set-Location dollar-datahub-context-guard-2026
npm.cmd test
npm.cmd run demo
```

Open `http://127.0.0.1:4310`, keep **Drop the production email field** selected, and click **Analyze intent**. No API key, Docker container, account, or production metadata is required for this synthetic demo. The expected decision is **EXTREME · block pending owner approval**.

The source is Apache-2.0 licensed. The official DataHub MCP adapter is in `src/mcp/`; its live-environment validation procedure is documented in `docs/LIVE_MCP_CHECKLIST.md`.
