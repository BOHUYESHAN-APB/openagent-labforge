# Configuration Examples

These are reference templates for `oh-my-opencode.jsonc`.

Where to put the config:

- Project: `.opencode/oh-my-opencode.jsonc`
- User:
  - Windows: `%APPDATA%\\opencode\\oh-my-opencode.jsonc`
  - macOS/Linux: `~/.config/opencode/oh-my-opencode.jsonc`

Profiles:

- `oh-my-opencode.classic.jsonc`: Keep OpenCode default `plan` and `build` lightweight.
- `oh-my-opencode.hybrid.jsonc`: Enable Labforge agents without replacing default `plan/build`.
- `oh-my-opencode.enhanced.jsonc`: Full orchestration (may use more tokens).

Notes:

- AUTO writes `oh-my-opencode.models.report.md` and `oh-my-opencode.models.rules.jsonc` to OpenCode config dir.
- Add `soul` config to enforce research principles from your local SOUL.md.
