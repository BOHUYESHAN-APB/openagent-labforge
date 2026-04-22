# MCP Auto-Enable Issue Fix

## Problem

When opening a new session, all MCP servers defined in `.mcp.json` or `.claude.json` were automatically enabled, even if they were not explicitly enabled or were marked as disabled in the configuration.

## Root Cause

In `src/features/claude-code-mcp-loader/transformer.ts`, the `transformMcpServer()` function was hardcoding `enabled: true` for all loaded MCP servers (lines 27 and 53), ignoring the `disabled` field from the original configuration.

```typescript
// Before (WRONG):
const config: McpRemoteConfig = {
  type: "remote",
  url: expanded.url,
  enabled: true,  // ❌ Always true, ignoring disabled field
}
```

## Solution

Modified `transformer.ts` to respect the `disabled` field from the original configuration:

```typescript
// After (CORRECT):
const enabled = expanded.disabled !== true  // ✅ Respect disabled field

const config: McpRemoteConfig = {
  type: "remote",
  url: expanded.url,
  enabled,  // ✅ Use computed value
}
```

## Behavior

### Before Fix
- All MCP servers in `.mcp.json` were enabled by default
- `disabled: true` in config was ignored
- Users saw all MCPs active in new sessions

### After Fix
- MCP servers respect the `disabled` field
- Default behavior: `enabled = true` (if `disabled` is not set)
- Explicit `disabled: true` → `enabled = false`
- Explicit `disabled: false` → `enabled = true`

## Example Configuration

```json
{
  "mcpServers": {
    "browser_puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "disabled": true  // ✅ Will be respected now
    },
    "paper_search_mcp": {
      "command": "uvx",
      "args": ["--native-tls", "--from", "paper-search-mcp", "python", "-m", "paper_search_mcp.server"]
      // No disabled field → enabled by default
    }
  }
}
```

## Testing

Build verification:
```bash
bun run build
# ✅ Build successful
```

Expected behavior:
1. MCPs without `disabled` field → enabled
2. MCPs with `disabled: true` → disabled
3. MCPs with `disabled: false` → enabled

## Files Modified

- `src/features/claude-code-mcp-loader/transformer.ts`
  - Added `enabled` computation based on `disabled` field
  - Applied to both remote (HTTP/SSE) and local (stdio) MCP types

## Related Code

The fix works in conjunction with:
- `src/features/claude-code-mcp-loader/loader.ts` - Handles `disabled` at config level
- `src/plugin-handlers/mcp-config-handler.ts` - Applies MCP policy and user overrides
- `src/mcp/extended.ts` - Defines built-in MCP defaults

## Impact

- **Low risk**: Only affects MCP enable/disable logic
- **Backward compatible**: Default behavior (enabled) unchanged for configs without `disabled` field
- **User benefit**: Users can now properly disable MCPs in their configuration files
