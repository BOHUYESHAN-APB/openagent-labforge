# Installation

## Current recommended path

OpenAgent Labforge is currently optimized for **local build + local install**.

The authoritative workflow is:

```bash
bun run build:skills-catalog
bun run build
bun pm pack
```

This produces a local tarball such as:

```text
bohuyeshan-openagent-labforge-core-<version>.tgz
```

## Local replacement flow

1. Build the tarball in the repo root.
2. Copy it into your OpenCode config directory.
3. Rename or replace it as `openagent-labforge-core-local.tgz`.
4. Run `bun install` inside the OpenCode config directory.

Typical OpenCode config directory:

- Windows: `%APPDATA%\opencode`
- macOS/Linux: `~/.config/opencode`

## Plugin registration

Current plugin package identity:

```json
{
  "plugin": ["@bohuyeshan/openagent-labforge-core"]
}
```

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

## Current distribution reality

- Local build + local replacement is the supported path right now.
- Public npm/release polish is still being cleaned up.
- If a lower-level document conflicts with current runtime behavior, prefer the
  root `README.md` plus this installation guide.

## Provenance

This project is a derivative of:

- `https://github.com/code-yeongyu/oh-my-openagent`

Current fork:

- `https://github.com/BOHUYESHAN-APB/openagent-labforge`
