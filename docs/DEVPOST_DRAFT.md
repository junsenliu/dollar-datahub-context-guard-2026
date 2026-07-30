# Devpost submission draft

## Project name

Dollar Data Context Guard

## Tagline

Turn a proposed agent data change into a traceable, metadata-aware, fail-closed decision before it reaches production.

## Description

Dollar Data Context Guard (DCG) is a new standalone DataHub MCP project for a gap that command-level agent guardrails cannot solve: a command can look dangerous without revealing whether the affected field contains PII, who owns it, or which downstream assets depend on it.

DCG sends a minimized asset query to DataHub, reads asset ownership, classifications, schema fields, and up to three hops of downstream lineage, then applies a local deterministic policy. It returns an allow, review, owner-approval, or block-pending-approval decision. The LLM is not a safety authority and cannot generate an arbitrary mutation.

The default demo uses a clearly labelled synthetic retail catalog so judges can reproduce the decision with no credentials. In `DCG_MODE=mcp`, the same adapter launches the official `mcp-server-datahub` package through `uvx` and makes read-only MCP tool calls against an authorized DataHub environment. Write-back is disabled unless a human explicitly enables it and approves a decision record.

## Judge path

```powershell
git clone <PUBLIC_REPOSITORY_URL>
Set-Location dollar-datahub-context-guard-2026
npm.cmd test
npm.cmd run demo
```

Open `http://127.0.0.1:4310`, select **Drop the production email field**, and press **Analyze intent**. The expected result is **EXTREME · block pending owner approval** because the synthetic asset is PII-tagged, production-scoped, and has three downstream dependents.

## Video sequence (under 3 minutes)

1. State the problem: an agent command cannot know the organizational impact of a field change.
2. Run the synthetic demo and show asset tags, owners, affected `email` field, and downstream lineage.
3. Show the deterministic decision and safe alternative; no mutation executes.
4. Show the official `uvx mcp-server-datahub@latest` runtime path and explain that the same adapter uses an authorized DataHub catalog when configured.
5. Close with the privacy boundary and failure mode: unresolved assets are fail-closed.

## Submission checklist

- [ ] Make the isolated repository public; verify the visible Apache-2.0 license.
- [ ] Test the real DataHub MCP path against an authorized DataHub environment.
- [ ] Record and publish the sub-three-minute video.
- [ ] Add repository URL, video URL, English description, and English testing instructions to Devpost.
- [ ] Select **DataHub MCP Server** on the submission form.
- [ ] Submit before 2026-08-10 17:00 EDT / 14:00 PDT.
