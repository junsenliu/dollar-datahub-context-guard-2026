# Next owner actions: DataHub

## 1. Enable hardware virtualization (blocking real local DataHub)

This PC already has WSL installed, but Windows reports that firmware virtualization is disabled. A normal Windows restart cannot change that setting.

1. Restart the PC and enter the HP BIOS/UEFI setup using the startup prompt (commonly `Esc` then `F10`, but follow the prompt shown on this device).
2. Find **Virtualization Technology**, **Intel Virtualization Technology**, or **VT-x** under System Configuration/Security.
3. Set it to **Enabled**, save changes, and boot Windows.
4. Open PowerShell and run:

```powershell
wsl --status
```

Expected: WSL 2 runs without a firmware-virtualization error.

## 2. Build the authorized local DataHub environment

After virtualization is enabled, install/start Docker Desktop, use DataHub's official Quickstart, and create only a harmless synthetic/test asset for the live MCP recording. Do not ingest production metadata for the competition demo.

## 3. Validate DCG's live MCP path

Follow [LIVE_MCP_CHECKLIST.md](LIVE_MCP_CHECKLIST.md) only after an authorized endpoint and least-privilege token are available. The project must remain truthful: until this succeeds, videos and Devpost must call the catalog **synthetic demo mode**.

## 4. Public release gate

Before the Devpost submission, create a new **public** GitHub repository containing only this isolated project. Verify there is no `.env.local`, no token, no production metadata, and no Dollar Steam source. The repository must visibly show Apache-2.0.
