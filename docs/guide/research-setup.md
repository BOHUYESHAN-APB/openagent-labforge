# Research Setup Guide

This guide explains how to configure Labforge for research workflows.

## Core safety settings (recommended)

```jsonc
{
  "experimental": {
    "strict_user_model_priority": true
  },
  "sisyphus_agent": {
    "force_agent_model_routing": false
  }
}
```

Meaning:
- User-selected model stays highest priority.
- Agent/model family hooks do not force rerouting.

## Full profile vs paper-only

- Full: literature + bioinformatics workflow
- Paper-only: literature workflow only

## Built-in MCP defaults (current)

Built-in MCPs (plugin-provided):
- `websearch`
- `context7`
- `grep_app`
- `browser_puppeteer`

Defaults:
- Enabled by default: `websearch`, `context7`, `grep_app`
- Disabled by default (but available in UI): `browser_puppeteer`

## MCP policy example

```jsonc
{
  "mcp_policy": {
    "network_profile": "auto",
    "bing_cn_english_fallback": true,
    "enable": ["browser_puppeteer"]
  }
}
```

Profile files:
- `plugins/opencode-agent-bio-paper/profiles/full.jsonc`
- `plugins/opencode-agent-bio-paper/profiles/paper-only.jsonc`

## Built-in document/research skills

Current built-ins include:
- `docx-workbench`
- `pdf-toolkit`
- `pptx-studio`
- `xlsx-analyst`
- `web-research`
- `data-analysis`

## Multi-source skills sync (recommended)

For Microsoft/OpenAI/Anthropic and local archive intake, use whitelist pipeline first:

1. `bun run skills:sync --dry-run`
2. `bun run skills:sync`
3. Load only `external/skills-whitelist` via `skills.sources`

Reference: `docs/guide/skills-multi-source-sync.md`

Unified bundle reference: `docs/guide/skills-unified-directory.md`

## Verification checklist

1. Select a model manually in UI.
2. Send multiple turns in same session and cross-session.
3. Confirm model does not switch unexpectedly.
4. Run `openagent-labforge doctor` and verify plugin/config status.
5. If using skills bundles, confirm `skills.bundle = "full"` or `"paper"` resolves the expected curated skills.
6. Confirm todo continuation does not interrupt obvious user-confirmation prompts.

## Network-aware search policy

- For Google-dependent retrieval/search MCPs, do not enable by default in mixed or restricted networks.
- Enable only when:
  - user explicitly requests it, or
  - runtime network checks confirm expected reachability.
- Always keep a fallback path:
  - arXiv/PubMed/Semantic Scholar MCP
  - browser-driven acquisition fallback

## Current performance note

- Skills bundle loading is now functioning correctly.
- Cold multi-window / multi-repository switching can still be noticeably affected by OpenCode host-side initialization behavior plus plugin startup work.
- The plugin already reduces repeated provider-cache reads and several repeated skill scans, but very large OpenCode host storage or very long sessions can still amplify cold-start latency.
