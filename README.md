# OpenAgent Labforge

OpenAgent Labforge is an OpenCode plugin fork focused on three things:

- stronger engineering-oriented orchestration
- explicit, inspectable child-session delegation
- bioinformatics-first specialist workflows

It is a derivative of `code-yeongyu/oh-my-openagent` and keeps upstream
license/provenance boundaries intact. See [LICENSE.md](LICENSE.md),
[NOTICE](NOTICE), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), and
[docs/licensing.md](docs/licensing.md).

## What This Fork Is Now

This README describes current runtime behavior only.

The plugin is now centered on:

- OpenCode-native delegation through `task(subagent_type=...)`
- stable plugin/agent/MCP injection for newer OpenCode behavior
- explicit search/doc/code/paper retrieval separation
- a growing first-party bioinformatics agent and skill stack
- local-first development and installation

## Current Core Capabilities

### Engineering orchestration

- `sisyphus`: main orchestrator
- `wase`: fully autonomous orchestrator
- `hephaestus`: deep coding executor
- `prometheus`: planner
- `atlas`: execution coordinator
- `metis`: pre-planning consultant
- `momus`: plan reviewer

These core agents are being upgraded with stronger engineering behavior:

- better scope discipline
- stronger verification expectations
- more explicit planning and review standards
- cleaner delegation contracts

Current engineering-capability layering:

- strong execution + orchestration: `sisyphus`, `wase`
- strong execution: `hephaestus`
- strong orchestration: `atlas`
- strong planning: `prometheus`, `metis`
- strong review: `momus`

This layering is intentional so future de-duplication stays easy if OpenCode
itself absorbs parts of the same capability set.

### Specialist agents

- `explore`: local codebase discovery
- `librarian`: focused upstream docs / SDK / library research
- `github-scout`: repository and implementation scouting
- `tech-scout`: ecosystem / benchmark / launch analysis
- `article-writer`: public technical writing
- `scientific-writer`: research-facing technical writing
- `multimodal-looker`: PDF / image / figure understanding

### Bioinformatics stack

The fork now has an explicit bioinformatics hierarchy:

- main bio entrypoints:
  `bio-orchestrator` for integrated coordination
  `bio-pipeline-operator` for execution-focused work
- internal specialists used through child-session delegation:
  `bio-methodologist` for computational design / QC / statistics planning
  `wet-lab-designer` for user-executed wet-lab validation planning
  `paper-evidence-synthesizer` for cross-paper evidence matrix and confidence grading

This is not limited to generic "analysis". The intended workflow includes:

- literature retrieval
- public dataset discovery
- computational analysis
- wet-lab validation design for the user to execute
- evidence integration
- specialist reporting

## Built-in Skill Direction

The built-in skill set now covers both general and bio workflows.

Examples:

- browser / UI / git:
  - `playwright`
  - `frontend-ui-ux`
  - `git-master`
- document / report:
  - `docx-workbench`
  - `pdf-toolkit`
  - `xlsx-analyst`
- bioinformatics:
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
- `bio-visualization`
- `vector-design`

The bio skills are written as execution-oriented references: they specify
preferred tools, typical commands/code paths, expected artifacts, and boundary
conditions rather than acting as vague prompt decoration.

Bio agents now also carry explicit data-interaction and environment-safety behavior:

- they ask users for the minimum decisive data when company or sequencing data is missing
- they separate required inputs from optional context
- they prefer `uv` for Python environments
- they prefer `conda` for mixed native stacks
- they call out when Windows users realistically need WSL/Linux

## Current MCP Set

The built-in MCP surface is intentionally tighter now.

Default built-ins kept visible:

- `websearch`
- `context7`
- `grep_app`
- `browser_puppeteer`
- `chrome-devtools-mcp`
- `deepwiki_mcp` (default off)
- `open_websearch_mcp`
- `paper_search_mcp`
- `semantic_scholar_fastmcp`

Removed from the built-in visible set:

- `arxiv_mcp`
- `fetch_browser`

Rationale:

- avoid duplicate capability surfaces
- keep the MCP list focused
- leave `deepwiki_mcp` opt-in instead of always-on

## OpenCode Compatibility Work

Recent migration work has focused on keeping pace with newer OpenCode behavior.

Already aligned or hardened:

- runtime plugin config discovery with canonical + legacy config compatibility
- agent registration and protected builtin-agent override handling
- command discovery:
  - `.opencode/command`
  - `.opencode/commands`
  - ancestor discovery up to worktree root
  - slash-style nested command names
- `.agents/skills` participation in injection chains
- MCP merge order and user override behavior
- todo continuation / compaction / stagnation guard regressions

The migration audit reference lives at:

- [docs/release/upstream-oh-my-openagent-3.11-plus-audit.md](docs/release/upstream-oh-my-openagent-3.11-plus-audit.md)

## Installation Reality

This project is still optimized for local-first use, but there is now a real
published path for `Windows x64`.

Current install reality:

- `Windows x64`: published npm package path is available
- other platforms: local build + local install remains the reliable path

Recommended workflow:

```bash
bun run build:skills-catalog
bun run build
bun pm pack
```

Then follow:

- [docs/guide/installation.md](docs/guide/installation.md)

## Reference Repos

Local comparison material is kept under `Future/` for migration and design work.

Current references include:

- upstream `oh-my-openagent`
- `BioClaw`
- `Geneclaw`
- `codex-main`

These are local reference trees, not part of the shipped plugin.

## Current Priorities

The near-term order is:

1. finish upstream OpenCode compatibility migration
2. strengthen engineering execution/orchestration capability in core agents
3. continue refining the bioinformatics agent + skill stack

## Docs

- [docs/guide/installation.md](docs/guide/installation.md)
- [docs/guide/orchestration.md](docs/guide/orchestration.md)
- [docs/guide/bio-skills.md](docs/guide/bio-skills.md)
- [docs/guide/bio-paper-autonomous-flow-v1.md](docs/guide/bio-paper-autonomous-flow-v1.md)
- [docs/reference/configuration.md](docs/reference/configuration.md)
- [docs/reference/features.md](docs/reference/features.md)

## Language Versions

- [English](README.md)
- [简体中文](README.zh-cn.md)
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [Русский](README.ru.md)
