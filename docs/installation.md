# Installation Guide

Current installation guidance for **ExtendAI Lab**.

## Current state

- **Package / product name:** `extendai-lab`
- **Current GitHub repository:** `BOHUYESHAN-APB/openagent-labforge-bio`
- **Why both exist:** the package/product naming migration is in progress, while the
  GitHub repository rename is scheduled separately.

## Recommended install path

Use a local source build for now:

```bash
git clone git@github.com:BOHUYESHAN-APB/openagent-labforge-bio.git
cd openagent-labforge-bio
bun install
bun run build
```

Then register the plugin in your OpenCode config.

### Windows

`%APPDATA%\opencode\opencode.json` or `.jsonc`

```jsonc
{
  "plugin": ["file:///D:/path/to/openagent-labforge-bio"]
}
```

### macOS / Linux

`~/.config/opencode/opencode.json` or `.jsonc`

```jsonc
{
  "plugin": ["file:///home/user/openagent-labforge-bio"]
}
```

## CLI naming

New CLI examples should use the new package name:

```bash
bunx extendai-lab install
```

The legacy CLI alias remains available during the compatibility window.

## Config file naming

Primary config basenames now use `extendai-lab`:

- `~/.config/opencode/extendai-lab.json`
- `~/.config/opencode/extendai-lab.jsonc`
- `<project>/.opencode/extendai-lab.json`
- `<project>/.opencode/extendai-lab.jsonc`

Legacy `openagent-labforge.json/.jsonc` files remain readable during the
compatibility window and are planned for removal in `v1.0.16`.

## Validation after install

```bash
opencode auth login
opencode models --refresh
opencode
```

Then verify agent selection and plugin behavior inside OpenCode.

## Related docs

- [OpenCode plugin guide](opencode/README.md)
- [Configuration](configuration.md)
- [Quick reference](quick-reference.md)
- [Repository rename plan](architecture/repository-rename.md)
