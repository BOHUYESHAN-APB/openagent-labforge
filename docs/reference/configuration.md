# Configuration Reference

This reference covers the practical configuration surface for the current OpenAgent Labforge workflow.

It is intentionally shorter and more operational than the inherited upstream reference.

---

## Config Files

Project config overrides user config.

1. `.opencode/openagent-labforge.jsonc`
2. `~/.config/opencode/openagent-labforge.jsonc`

Use JSONC with comments/trailing commas if you want.

Schema:

```json
{
  "$schema": "https://raw.githubusercontent.com/BOHUYESHAN-APB/openagent-labforge/main/assets/openagent-labforge.schema.json"
}
```

---

## Minimal Practical Example

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/BOHUYESHAN-APB/openagent-labforge/main/assets/openagent-labforge.schema.json",

  "i18n": {
    "enabled": true,
    "display_language": "zh-CN"
  },

  "skills": {
    "bundle": "full"
  },

  "mcp_policy": {
    "search_english_fallback": true
  }
}
```

---

## High-Value Sections

### agents

Use this when you need to override agent model, prompt, permissions, or mode.

Examples of important current agents:

- `sisyphus`
- `hephaestus`
- `prometheus`
- `atlas`
- `librarian`
- `explore`
- `github-scout`
- `tech-scout`
- `article-writer`
- `scientific-writer`

Use agent overrides sparingly. The system now depends heavily on correct role boundaries between these agents.

### categories

Categories are the preferred way to shape delegated work by intent rather than by model name.

Built-in categories worth remembering:

- `quick`
- `unspecified-low`
- `unspecified-high`
- `visual-engineering`
- `deep`
- `ultrabrain`
- `writing`

### background_task

Controls background concurrency and stale timeouts.

This matters because OpenAgent Labforge uses many child sessions and delegated runs.

### mcp_policy

Current important fields:

- `search_english_fallback`
- `network_profile`
- `enable`
- `disable`

Important search split:

- `websearch` = higher-quality precision search
- `open_websearch_mcp` = broad multi-engine recall
- `paper_search_mcp` = academic retrieval

### disabled_*

Use `disabled_agents`, `disabled_tools`, `disabled_hooks`, `disabled_mcps`, `disabled_skills`, and `disabled_commands` carefully.

Important product decision currently in force:

- do not casually disable `question` in normal interactive use; it remains important for clarification-heavy workflows

---

## Skills

The skill system now follows OpenCode-style directory discovery more closely.

Important locations:

- `.opencode/skills/*/SKILL.md`
- `~/.config/opencode/skills/*/SKILL.md`
- `.claude/skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`

Project-local skill discovery walks upward toward the git root.

The installer also bootstraps a managed plugin skill:

- `skills/openagent-labforge/SKILL.md`

---

## MCP Notes

Current practical MCP notes:

- local MCP env for built-ins should use `environment`, not `env`
- `open_websearch_mcp` depends on stdio mode and explicit environment forwarding
- `paper_search_mcp` currently uses the compatibility launcher path because the cleaner `uvx paper-search-mcp` path proved unreliable in this environment

---

## Release Reality

This reference describes the current local-first workflow, not a fully generalized npm-first public release surface.

If docs conflict, prefer:

1. root `README.md`
2. `docs/guide/installation.md`
3. this file

Then verify against current source/config behavior.
