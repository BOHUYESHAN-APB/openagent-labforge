# Configuration Examples

These are reference templates for `openagent-labforge.jsonc`.

Where to put the config:

- Project: `.opencode/openagent-labforge.jsonc`
- User:
  - Windows: `%APPDATA%\\opencode\\openagent-labforge.jsonc`
  - macOS/Linux: `~/.config/opencode/openagent-labforge.jsonc`

Profiles:

- `openagent-labforge.classic.jsonc`: Keep OpenCode default `plan` and `build` lightweight.
- `openagent-labforge.hybrid.jsonc`: Enable Labforge agents without replacing default `plan/build`.
- `openagent-labforge.enhanced.jsonc`: Full orchestration (may use more tokens).
- `openagent-labforge.mcp-research.jsonc`: MCP-heavy setup with policy-based toggles (built-in MCPs default to enabled).
- `openagent-labforge.skills-whitelist.jsonc`: Load only allowlisted skills synchronized from external sources.
- `openagent-labforge.skills-full.jsonc`: Load the generated unified full skills bundle.
- `openagent-labforge.skills-paper.jsonc`: Load the generated unified paper skills bundle.

Notes:

- AUTO writes `openagent-labforge.models.report.md` and `openagent-labforge.models.rules.jsonc` to OpenCode config dir.
- Add `soul` config to enforce research principles from your local SOUL.md.

Skills multi-source sync:

- Run `bun run skills:sync --dry-run` to inspect classification (`allow/review/deny`) before writing.
- Run `bun run skills:sync` to generate:
  - `external/skills-whitelist/`
  - `external/skills-quarantine/`
  - `external/skills-manifest.json`
- Load only whitelist output via:

```jsonc
{
  "skills": {
    "sources": [{ "path": "./external/skills-whitelist", "recursive": true }]
  }
}
```

Generated unified bundles:

- Run `bun run build:skills-catalog`
- Then select one bundle:

```jsonc
{
  "skills": {
    "bundle": "full"
  }
}
```

or:

```jsonc
{
  "skills": {
    "bundle": "paper"
  }
}
```
