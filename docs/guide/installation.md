# Installation

## Recommended Installation Method (All Platforms)

The recommended installation method is to build locally and install into OpenCode's local config directory (not global npm):

### Step 1: Clone and Build

```bash
# Clone the repository
git clone https://github.com/BOHUYESHAN-APB/openagent-labforge.git
cd openagent-labforge

# Install dependencies
bun install

# Build the plugin
bun run build

# Create package tarball
npm pack
```

This produces a tarball: `bohuyeshan-openagent-labforge-core-<version>.tgz`

### Step 2: Install Into OpenCode Config Directory

```bash
# Linux/macOS
cd ~/.config/opencode

# Windows
cd C:\Users\<YourUsername>\.config\opencode

# Install into OpenCode-local node_modules
npm install /path/to/openagent-labforge/bohuyeshan-openagent-labforge-core-<version>.tgz
```

### Step 3: Verify Installation

```bash
# Check OpenCode-local installation
npm list @bohuyeshan/openagent-labforge-core
```

You should see: `@bohuyeshan/openagent-labforge-core@<version>`

### Step 4: Configure OpenCode (Both Files Required)

Update your OpenCode configuration file to use the package name (not file:// path):

**Location:**
- Windows: `C:\Users\<YourUsername>\.config\opencode\opencode.json`
- macOS/Linux: `~/.config/opencode/opencode.json`

**Configuration:**
```json
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core@<version>",
    "opencode-pty@0.3.2"
  ]
}
```

If your OpenCode build separates server and TUI plugin registration, you must configure both files:

- `opencode.json` for server hooks/tools/commands
- `tui.json` for TUI slash commands and TUI surfaces

`tui.json` example:

```json
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core@<version>"
  ]
}
```

**Important:** Use the package name with version, NOT `file:///` paths. The file:// path method may not load the plugin correctly.

### Step 5: Restart OpenCode

Completely restart OpenCode (not just exit TUI, close the entire process).

### Step 6: Verify Plugin Loaded

After restart, verify the plugin is loaded:

1. Check that you can see multiple agents (not just plan/builder)
2. Try commands: `/ol-settings`, `/ol-ctx-status`
3. Check for Magic Context sidebar (if enabled)

## Alternative: Published npm Package (Windows x64 only)

For Windows x64, you can use the published package directly:

```bash
npm install -g @bohuyeshan/openagent-labforge-core
```

Then configure as above using the package name.

**Note:** Published packages may not always be the latest version. Building locally ensures you have the most recent features.

## Plugin registration

Current plugin package identity:

```json
{
  "plugin": ["@bohuyeshan/openagent-labforge-core"]
}
```

For OpenCode versions that separate server and TUI plugin registration, mirror the
same plugin entry into:

- `opencode.json(c)` for server hooks/tools/commands
- `tui.json(c)` for TUI slash commands and TUI UI surfaces

Example:

```json
// opencode.json or opencode.jsonc
{
  "plugin": ["@bohuyeshan/openagent-labforge-core"]
}
```

```json
// tui.json or tui.jsonc
{
  "plugin": ["@bohuyeshan/openagent-labforge-core"]
}
```

## Local Development Workflow

For active development on the plugin itself:

### Option 1: OpenCode-Local Install (Recommended)

After making changes, rebuild and reinstall:

```bash
# In the plugin repository
bun run build
npm pack

# In OpenCode config directory
cd ~/.config/opencode
# or Windows: cd C:\Users\<YourUsername>\.config\opencode
npm install /path/to/openagent-labforge/bohuyeshan-openagent-labforge-core-<version>.tgz
```

Then restart OpenCode to load the updated plugin.

### Option 2: File Path (Not Recommended)

**Warning:** Using `file:///` paths may not work correctly. If you must use this method:

```json
{
  "plugin": ["file:///ABSOLUTE/PATH/TO/openagent-labforge"]
}
```

**Known Issues:**
- Plugin may not load correctly
- Custom agents may not appear
- TUI components may not register

If you experience these issues, switch to the global install method above.

## Recommended companion plugins

Strongly recommended alongside this plugin:

- `opencode-pty`
- `@tarquinen/opencode-dcp`

These are not hard dependencies, but they improve the practical local workflow.

## Plugin config file

Use one of these:

- Project: `.opencode/openagent-labforge.jsonc`
- User: `~/.config/opencode/openagent-labforge.jsonc`

Minimal example:

```jsonc
{
  "i18n": {
    "enabled": true,
    "language": "zh-CN"
  },
  "skills": {
    "bundle": "full"
  },
  "mcp_policy": {
    "search_english_fallback": true
  }
}
```

## Search and MCP positioning

- `websearch` -> higher-quality precision search
- `open_websearch_mcp` -> broader multi-engine recall
- `paper_search_mcp` -> academic retrieval
- `context7` -> official docs / framework reference
- `grep_app` -> GitHub code examples

## Child-session delegation

If you want inspectable child sessions in OpenCode, prefer:

```text
task(subagent_type="...")
```

That is the canonical route for retrievable metadata, visible child sessions,
and stable model-fallback handling.

## Troubleshooting

### Plugin Not Loading

**Symptoms:**
- Only see plan/builder agents, no custom agents
- `/ol-settings` command not available
- No Magic Context sidebar

**Solution:**
1. Verify OpenCode-local installation in `~/.config/opencode`: `npm list @bohuyeshan/openagent-labforge-core`
2. Check both `opencode.json` and `tui.json` include the plugin entry
3. Check config uses package name, not file:// path
4. Completely restart OpenCode (close entire process)
5. Check OpenCode logs for errors

### Build Errors

If `bun run build` fails:

```bash
# Clean and rebuild
rm -rf dist node_modules
bun install
bun run build
```

### Version Mismatch

If you see version conflicts:

```bash
# Uninstall old version
npm uninstall -g @bohuyeshan/openagent-labforge-core

# Reinstall fresh
npm install -g ./bohuyeshan-openagent-labforge-core-<version>.tgz
```

## Distribution Status

- **All platforms:** Local build + install to OpenCode config directory (recommended)
- **Published scope (current release policy):** main package + Windows platform packages first
- **Other platforms:** Use local build/local install until corresponding platform packages are published

For the latest features and fixes, always build locally from the repository.

## Provenance

This project is a derivative of:

- `https://github.com/code-yeongyu/oh-my-openagent`

Current fork:

- `https://github.com/BOHUYESHAN-APB/openagent-labforge`
