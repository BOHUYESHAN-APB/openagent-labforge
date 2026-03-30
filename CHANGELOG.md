# Changelog

## v3.12.0

- aligned MCP installation with OpenCode's static MCP registry so MCP list/UI reflects configured servers reliably
- kept both browser MCPs, added `chrome-devtools-mcp`, and restored a stable browser/runtime configuration path
- fixed plugin identity/config path drift so the forked package resolves as `@bohuyeshan/openagent-labforge-core`
- added installer sync for static MCP config in `opencode.json` / `opencode.jsonc`
- corrected Windows config-source skill discovery by resolving real paths before glob filtering
- aligned publish scripts, workflows, platform package manifests, and schema metadata to `openagent-labforge-*`
