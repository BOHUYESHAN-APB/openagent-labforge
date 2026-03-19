# Plugins

This directory contains companion plugins that ship with the core `openagent-labforge` harness.

## Bundle Strategy

We maintain two bundle targets:

1. `full`
   - Core harness (`openagent-labforge-core`)
   - `opencode-agent-bio-paper`
   - `opencode-mcp-paper-search`
   - Audience: bioinformatics + literature end-to-end workflows

2. `paper-only`
   - Core harness (`openagent-labforge-core`)
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
- New independent identity uses `@labforge/*` package names with a fresh semver line.

## Release Order

1. Validate core plugin behavior and compatibility.
2. Release companion plugins.
3. Update bundle manifests and installation docs.

## Identity Targets

- Core: `@labforge/openagent-labforge-core`
- Bio/Paper companion: `@labforge/opencode-agent-bio-paper`
- Paper-search companion: `@labforge/opencode-mcp-paper-search`
- Aggregate installers:
  - `@labforge/openagent-labforge` (full)
  - `@labforge/openagent-labforge-paper` (paper-only)
