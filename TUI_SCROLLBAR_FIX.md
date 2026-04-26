# TUI Scrollbar Fix

## Problem

After installing the openagent-labforge plugin, users reported that the vertical scrollbar disappeared from the OpenCode TUI.

## Root Cause

The scrollbar visibility is controlled by OpenCode's KV (key-value) store with the key `scrollbar_visible`. OpenCode's default value is `false`, meaning the scrollbar is hidden by default.

The scrollbar setting is stored in: `~/.local/state/opencode/kv.json`

## Investigation Results

1. **OpenCode's Default Behavior**: The scrollbar is disabled by default in OpenCode itself
   - Code location: `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx:164`
   - Default: `kv.signal("scrollbar_visible", false)`

2. **Our Plugin's Impact**: The plugin does NOT modify the scrollbar setting
   - Our plugin only uses KV for its own settings (scope and language)
   - No interference with OpenCode's scrollbar logic

3. **User Experience Issue**: Users expect the scrollbar to be visible by default
   - The scrollbar can be toggled manually via command palette
   - But this is not discoverable for new users

## Solution

### Implemented Fix (v1.15.0+)

The plugin now automatically enables the scrollbar on first install:

```typescript
// src/tui/index.ts
const OpenAgentLabforgeTuiPlugin: TuiPlugin = async (api, _options, meta) => {
  // Enable scrollbar by default on first install
  if (meta.state === "first") {
    const currentScrollbarSetting = api.kv.get<boolean>("scrollbar_visible", false)
    if (!currentScrollbarSetting) {
      api.kv.set("scrollbar_visible", true)
    }
  }
  // ... rest of plugin initialization
}
```

### How It Works

1. **First Install Detection**: Uses `meta.state === "first"` to detect first-time plugin installation
2. **Non-Intrusive**: Only sets the scrollbar if it's currently disabled
3. **Respects User Preference**: If user has already enabled it, we don't touch it
4. **One-Time Operation**: Only runs on first install, not on updates

### Manual Toggle (For Existing Users)

If you installed the plugin before this fix, you can manually enable the scrollbar:

1. Press `Ctrl+K` to open the command palette
2. Search for "Toggle session scrollbar"
3. Press Enter to toggle

Or edit the KV store directly:

```bash
# Edit ~/.local/state/opencode/kv.json
# Change "scrollbar_visible": false to "scrollbar_visible": true
```

## Testing

1. **Build Verification**: ✅ Build succeeds with no TypeScript errors
2. **Logic Verification**: ✅ Only runs on first install (`meta.state === "first"`)
3. **Non-Intrusive**: ✅ Checks current setting before modifying

## Documentation Updates

1. **README.md**: Added troubleshooting section explaining the scrollbar behavior
2. **CHANGELOG.md**: Added entry in "Patch fixes" section
3. **This Document**: Created comprehensive explanation of the issue and fix

## Future Considerations

- Consider adding a plugin setting to control this behavior
- Could add a welcome message on first install mentioning the scrollbar
- Could add to plugin settings UI for easy toggle

## Related Files

- `src/tui/index.ts` - Plugin initialization with scrollbar fix
- `README.md` - Troubleshooting section
- `CHANGELOG.md` - Release notes
- OpenCode reference: `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx:164`
- KV store: `~/.local/state/opencode/kv.json`
