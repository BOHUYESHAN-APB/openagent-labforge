# Plugins

This directory contains companion plugins that pair with the core
`openagent-labforge` plugin.

## Bundle Strategy

We maintain two bundle targets:

1. `full`
   - Core harness (`openagent-labforge`)
   - `opencode-agent-bio-paper`
   - `opencode-mcp-paper-search`
   - Audience: bioinformatics + literature end-to-end workflows

2. `paper-only`
   - Core harness (`openagent-labforge`)
   - `opencode-agent-bio-paper` in paper profile
   - `opencode-mcp-paper-search`
   - Audience: search, read, summarize, cite, outline, draft

See `plugins/BUNDLES.md` for the release matrix and profile details.

## Current Plugin Packages

- `plugins/opencode-agent-bio-paper`
- `plugins/opencode-mcp-paper-search`

## Versioning Rules

- Core and companion plugins share major/minor compatibility.
- Companion plugins can release patch updates independently.
- Bundle manifests must pin compatible ranges and include migration notes.
- Aggregate package naming is still being finalized; current live install flow is
  local-first and centered on `@bohuyeshan/openagent-labforge-core`.

## Release Order

1. Validate core plugin behavior and compatibility.
2. Release companion plugins.
3. Update bundle manifests and installation docs.

## Current release note

Treat this directory as release scaffolding and companion-plugin context, not as
the primary install surface. For current user installation, prefer the root
README plus `docs/guide/installation.md`.
