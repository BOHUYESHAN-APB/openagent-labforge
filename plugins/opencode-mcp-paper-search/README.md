# opencode-mcp-paper-search

Status: scaffold with bundle integration metadata.

Goal:

- Provide a paper search MCP bundle/adapter for `openagent-labforge`.

## Bundle Membership

- Included in:
  - `openagent-labforge-full`
  - `openagent-labforge-paper-only`

See `plugins/BUNDLES.md` and `plugins/bundles/*.bundle.json`.

Notes:

- Prefer MIT/Apache-2.0 MCP servers where possible.
- Keep provider/API keys out of source control.
- For Google-dependent retrieval paths, require explicit opt-in or network-aware gating.

## License & Attribution

- This plugin scaffold and integration policy are documented under this repository attribution model.
- Third-party MCP licenses are tracked in:
  - `THIRD_PARTY_NOTICES.md`
  - `plugins/opencode-mcp-paper-search/MCP_CANDIDATES.md`
  - `plugins/opencode-mcp-paper-search/MCP_SHORTLIST.md`

## Trust Boundary

- MCP servers may exfiltrate network data by design.
- Default policy: disable unknown-license or unknown-key-requirement servers.
- Browser/scraping MCPs must pass explicit usage-constraint review before default enablement.

## Compatibility

- Requires `oh-my-opencode >=3.11.0 <4.0.0`

License: Follows repository-level licensing boundary; third-party MCPs retain their original licenses.
