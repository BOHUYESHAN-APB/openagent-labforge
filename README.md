# OpenAgent Labforge

> [!NOTE]
> **Derivative Notice**
>
> OpenAgent Labforge is a derivative of `code-yeongyu/oh-my-openagent`
> (formerly `oh-my-opencode`). This fork keeps the upstream license boundary
> and provenance while changing product direction toward OpenCode-native
> delegation, research workflows, MCP ergonomics, and local-first operation.
>
> See `LICENSE.md`, `NOTICE`, `THIRD_PARTY_NOTICES.md`, and
> `docs/licensing.md` for attribution and license context.

## What changed in this fork

This README is intentionally focused on **current runtime behavior**, not on
upstream history or manifesto copy.

### 1. Agent system is now more explicit and inspectable

- Clearer separation between orchestration agents and specialist agents
- Native child-session delegation through the `task(subagent_type=...)` path
- Better boundaries between:
  - `librarian` -> one library / framework / SDK question
  - `github-scout` -> repo landscape and study shortlist
  - `tech-scout` -> ecosystem / benchmark / launch synthesis
  - `article-writer` -> public-facing technical writing
  - `scientific-writer` -> peer-facing scientific / technical writing
- Background session fallback handling is hardened so delegated work keeps a
  consistent model-fallback policy

### 2. Search flow is now split by retrieval quality

- `websearch` -> higher-quality precision search
- `open_websearch_mcp` -> broader multi-engine recall
- `paper_search_mcp` -> academic retrieval
- `context7` -> official library / framework documentation
- `grep_app` -> GitHub code examples

The plugin now prefers lightweight search policy hints rather than aggressive
prompt injection that overrode explicitly chosen specialist agents.

### 3. MCP runtime behavior is more stable

- `bing_cn_mcp` was replaced by `open_websearch_mcp`
- `open_websearch_mcp` now uses the correct local MCP `environment` handling,
  stdio mode, prompt-probe compatibility, pinned package version, and a longer
  startup timeout
- `paper_search_mcp` was moved back to the launcher path that actually works in
  this Windows/OpenCode environment
- MCP policy now matches the intended product split: precision search first,
  broad recall when needed, academic retrieval when required

### 4. Skill discovery is closer to OpenCode behavior

- Project-local skill discovery walks upward toward git root
- `SKILL.md` metadata is validated more strictly
- Installer bootstraps an `openagent-labforge` skill directory automatically
  for more reliable plugin-aware routing

### 5. Release/install surfaces are being de-upstreamed

- Root README surfaces are fork-owned instead of inherited upstream marketing
- Installer branding and package metadata now match the current fork identity
- Current supported path is still **local build + local install**, not a fully
  polished npm release workflow yet

## Current agent layout

### Core orchestrators

- `sisyphus` - default orchestrator
- `hephaestus` - deep coding worker
- `prometheus` - planner
- `atlas` - execution coordinator
- `sisyphus-junior` - category-based delegated executor

### Specialist agents

- `explore` - local codebase discovery
- `librarian` - focused upstream dependency research
- `github-scout` - repository scouting and comparative study
- `tech-scout` - ecosystem / benchmark / launch analysis
- `article-writer` - broad public technical writing
- `scientific-writer` - scientific / specialist writing
- bio and multimodal specialists remain available where configured

## Current installation reality

This project is currently optimized for:

1. local build
2. local tarball packaging
3. local replacement in the OpenCode config directory

Use:

```bash
bun run build:skills-catalog
bun run build
bun pm pack
```

Then follow `docs/guide/installation.md`.

## Docs map

- `docs/guide/installation.md` - current install and replacement flow
- `docs/guide/overview.md` - product shape and workflow split
- `docs/guide/orchestration.md` - planning / execution / delegation model
- `docs/reference/configuration.md` - config reference
- `docs/reference/features.md` - capability reference
- `examples/README.md` - config examples and bundle examples

## Known limits

- The project is still local-first; polished public npm release flow is not the
  main supported path yet
- Some secondary docs still need cleanup to fully remove stale upstream
  terminology
- Browser-oriented MCP runtime remains more environment-sensitive than the core
  search/doc/code MCP set

## Provenance

We preserve upstream attribution and license boundaries while changing product
direction and runtime behavior in this fork.

- Upstream: `https://github.com/code-yeongyu/oh-my-openagent`
- Current fork: `https://github.com/BOHUYESHAN-APB/openagent-labforge`

If a lower-level document conflicts with this README and the current runtime,
prefer this README plus `docs/guide/installation.md` as the more authoritative
surface.

## Language versions

- [English](README.md)
- [简体中文](README.zh-cn.md)
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [Русский](README.ru.md)
