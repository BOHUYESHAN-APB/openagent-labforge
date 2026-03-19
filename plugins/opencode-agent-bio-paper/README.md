# opencode-agent-bio-paper

Status: scaffold with bundle profile specification.

Goal:

- Bioinformatics + paper reading/writing workflow agents.
- Designed to work with the `openagent-labforge` core plugin.

Planned capabilities:

- Literature workflow: search, read, summarize, cite, outline, draft.
- Bioinformatics workflow: sequence search/download, format conversion, basic analysis, R/Python execution.
- Optional MCP integrations for paper search and bio databases.

## Bundle Profiles

- `full`: literature + bioinformatics enabled
  - config: `profiles/full.jsonc`
- `paper-only`: literature enabled, bioinformatics disabled
  - config: `profiles/paper-only.jsonc`

## Compatibility

- Requires `@bohuyeshan/openagent-labforge-core >=3.11.0 <4.0.0`
- Part of both bundles defined in `plugins/BUNDLES.md`

License: TBD (intend MIT for original code; must not copy upstream SUL-licensed code).
