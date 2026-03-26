# Overview

OpenAgent Labforge is a derivative fork of `code-yeongyu/oh-my-openagent` focused on a more stable OpenCode-native workflow:

- local-first installation and packaging
- explicit agent boundaries
- MCP ergonomics for precision search, broad recall, and academic retrieval
- inspectable child-session delegation through the `task` path

For provenance and license boundaries, see:

- `README.md`
- `LICENSE.md`
- `NOTICE`
- `THIRD_PARTY_NOTICES.md`
- `docs/licensing.md`

---

## Current Product Shape

### Core orchestrators

- `sisyphus` - default orchestrator
- `hephaestus` - deep coding / GPT-style execution path
- `prometheus` - planning
- `atlas` - execution coordination
- `sisyphus-junior` - category-based delegated executor

### Specialist agents

- `explore` - local codebase discovery
- `librarian` - one upstream library / framework / SDK question
- `github-scout` - repository landscape and study shortlist
- `tech-scout` - ecosystem / benchmark / launch synthesis
- `article-writer` - public-facing technical writing
- `scientific-writer` - peer-facing scientific or technical writing

---

## Search and MCP Positioning

OpenAgent Labforge intentionally separates search roles:

- `websearch` - higher-quality precision-oriented search
- `open_websearch_mcp` - broader multi-engine recall
- `paper_search_mcp` - academic retrieval
- `context7` - official docs / library reference
- `grep_app` - GitHub code examples

Use direct tools first. Escalate to specialist agents only when scope, evidence quality, or synthesis requirements justify it.

---

## Recommended Workflow

### 1. Normal work

For direct coding, debugging, and review, stay with the default orchestrator and use the normal tool flow.

### 2. Explicit child-session delegation

When you need inspectable subagent execution in OpenCode, prefer the `task(subagent_type=...)` path.

This is the canonical route for:

- retrievable task metadata
- child-session visibility in the UI
- model fallback consistency
- specialist-agent execution without ambiguous direct-invocation behavior

### 3. Planning-heavy work

Use Prometheus planning first when the task is large, ambiguous, or spans multiple sessions. Then hand execution to Atlas / delegated tasks.

---

## Current Installation Reality

At the moment, the project is optimized for:

1. local build
2. local tarball packaging
3. local replacement in the OpenCode config directory

See `docs/guide/installation.md` for the current authoritative install flow.

---

## What This Guide Set Is For

- `installation.md` - current install and local replacement flow
- `orchestration.md` - how planning, execution, and delegation fit together
- `agent-model-matching.md` - how agent/category defaults map to models
- `../reference/configuration.md` - practical config reference
- `../reference/cli.md` - CLI command reference
- `../reference/features.md` - feature and capability summary

If a document still conflicts with current runtime behavior, treat the root README plus `installation.md` as the more authoritative source.
