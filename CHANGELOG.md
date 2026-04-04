# Changelog

## Unreleased

### Patch fixes

- normalized session agent storage to config keys so display-name recovery does not break continuation paths
- split atlas idle continuation logic into dedicated modules to reduce event-handler complexity and stabilize session resume behavior
- restored OpenCode's lightweight `build` and `plan` agents by default; our plugin now only hijacks them when explicitly configured

### OpenCode compatibility

- aligned plugin config discovery around `openagent-labforge.*` with legacy `oh-my-opencode.*` fallback
- restored protected builtin-agent registration behavior and upstream-style `agent-config-handler` logic
- added ancestor `.opencode/command(s)` discovery with slash-style nested command names
- added `.agents/skills` participation to command and agent awareness chains
- hardened MCP merge behavior and trimmed redundant built-in MCPs
- expanded todo continuation regression coverage for compaction, stagnation, and dispose behavior

### MCP changes

- removed `arxiv_mcp` from the built-in visible set
- removed `fetch_browser` from the built-in visible set
- kept `deepwiki_mcp` available but default-off

### Agent system

- added `bio-orchestrator`
- added `wet-lab-designer`
- switched `Sisyphus-Junior` toward first-class `task(subagent_type=...)` delegation instead of compatibility-only `call_omo_agent`
- started layering shared engineering execution/orchestration/planning/review capability blocks into core agents

### Bioinformatics

- expanded first-party bioinformatics skills:
  - `bio-tools`
  - `bio-methods`
  - `wet-lab-design`
  - `bio-pipeline`
  - `paper-evidence`
  - `differential-expression`
  - `scrna-preprocessing`
  - `cell-annotation`
  - `pubmed-search`
  - `geo-query`
  - `sequence-analysis`
  - `structural-biology`

### Docs

- rewrote `README.md` to reflect only the current product surface
- rewrote `README.zh-cn.md` to match the current fork direction
- added `docs/release/upstream-oh-my-openagent-3.11-plus-audit.md`
