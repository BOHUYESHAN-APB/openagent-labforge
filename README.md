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
- repo-local runtime workflow memory under `.opencode/openagent-labforge/`
- local-first development and installation

## Protocol Compatibility

New code in this fork follows the upstream plugin protocol surface wherever
possible and extends it rather than replacing it casually.

The current rule is:

- keep upstream-compatible config and injection behavior
- keep upstream-style agent / MCP / command / skill registration surfaces
- carry forward the original plugin contract before adding fork-specific behavior
- document deliberate divergences instead of silently changing protocol shape

This reduces drift and keeps future upstream sync work tractable.

## Current Model Recommendation

Current project recommendation for manual model choice:

- strongly recommended:
  - GPT family
  - GLM family
  - Kimi family
- also recommended:
  - Google / Gemini
- also currently adapting well:
  - DeepSeek family
- supported, but not fully re-validated in the latest local test cycle:
  - Claude family

Gemini note:

- in this fork's long-context prompt and tool-routing setup, Gemini is more
  likely to drift into an unexpected language or mixed-language response when
  prompts become very long, especially for users who switch between Chinese and
  English

## Context Window Recommendation

For the best results, prefer models that can stably provide more than 400K
context.

Recommended examples:

- GPT-5.4-class long-context models
- Gemini-class long-context models

Practical guidance:

- above 400K usually works noticeably better for this plugin than short-context
  models
- avoid pushing the context window to the advertised maximum by default
- keep effective working context around 500K-550K when possible
- avoid going much past 600K unless the task truly needs it

Reason:

- this plugin injects agent prompts, skill content, task metadata, tool traces,
  and child-session context
- leaving headroom is usually more stable than running the context window at the
  limit

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

### Runtime workflow memory

Long-horizon work is now anchored under:

- `.opencode/openagent-labforge/`

Current runtime workflow structure includes:

- repo-local runtime state
- `mission.md`
- `roadmap.md`
- stage memory:
  - `plan.md`
  - `build.md`
  - `review.md`
- wave memory:
  - `wave-001-plan.md`
  - `wave-001-build.md`
  - `wave-001-review.md`
- document workspaces
- paper cache

This is intended to keep long tasks inspectable and compaction-safe without
spreading temporary state across multiple top-level directories.

### Autonomous execution modes

Autonomous flows now distinguish two levels and two interaction styles:

- levels:
  - `light`
  - `heavy`
- interaction styles:
  - `batch`
  - `continuous`

Current behavior:

- `light + batch` is for tighter reviewed batches and does not force an
  oversized backlog
- `heavy + continuous` is for longer multi-wave execution and pushes backlog
  expansion, review routing, and continuation harder

Mode selection is runtime-scoped and stored in the repo-local workflow state.

### Session cleanup commands

The fork now includes built-in slash commands for clearing stale execution
residue from older sessions.

Current cleanup commands:

- `/stop-continuation`
- `/todo-clear`
- `/workflow-reset`
- `/focus-chat`

Practical intent:

- `/stop-continuation` stops continuation mechanisms for the current session
- `/todo-clear` clears stale todos and session-level execution residue
- `/workflow-reset` clears current session workflow state before a fresh tracked
  execution run
- `/focus-chat` returns the current session to ordinary chat mode and suppresses
  stale execution carry-over

This matters because old todo/workflow state can otherwise leak into later
conversations and make semi-automatic sessions feel heavy or misdirected.

### Checkpoint handoff commands

The fork now also includes repo-local checkpoint commands for long-running work
that should continue in a fresh session instead of stretching one chat
indefinitely.

Current checkpoint commands:

- `/handoff`
- `/checkpoint`
- `/checkpoint-resume`

Practical intent:

- `/handoff` creates an inline continuation summary for manual copy/paste into a
  new session
- `/checkpoint` writes a repo-local checkpoint under
  `.opencode/openagent-labforge/checkpoints/` so the next session can resume
  from file instead of old chat history
- `/checkpoint-resume` loads the latest or specified checkpoint and rebuilds the
  next execution wave in the current session

This is the plugin-side fallback for older or unstable OpenCode desktop builds:
it keeps cross-session continuation usable even when the upstream UI does not
yet provide a first-class checkpoint flow.

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
  - `backend-architecture`
  - `git-master`
- document / report:
  - `docx-workbench`
  - `pdf-toolkit`
  - `pptx-studio`
  - `proposal-and-roadmap`
  - `document-asset-pipeline`
  - `literature-synthesis`
  - `xlsx-analyst`
- bioinformatics:
  - `bio-tools`
  - `blast-search`
  - `functional-annotation`
  - `bio-methods`
  - `wet-lab-design`
  - `bio-pipeline`
  - `paper-evidence`
  - `differential-expression`
  - `scrna-preprocessing`
  - `cell-annotation`
  - `atac-seq`
  - `chip-seq`
  - `metagenomics`
  - `proteomics`
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

### Document and paper workspace behavior

Document-oriented skills now provision repo-local work areas automatically under
the runtime workflow root.

Current behavior includes:

- document workspace creation on relevant writing/document skills
- paper cache creation on literature / paper-oriented skills
- asset, output, and revision manifests
- child git repo initialization for document source workspaces when needed

This is intentionally source-first:

- source material and manifests are tracked in the document workspace
- binary outputs remain generated artifacts

Current figure policy:

- the document flow is currently SVG-first
- when a figure is needed and no image-bus backend is configured, the system
  should insert SVG placeholders or SVG-derived figures first
- users can replace those later with final generated or manually refined figures

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
- semi-auto session hardening so ordinary main-session chat is not dragged back
  into stale todo/workflow continuation
- runtime agent-name normalization across delegation, background, recovery, and
  continuation flows so OpenCode receives valid display names instead of stale
  internal keys

The migration audit reference lives at:

- [docs/release/upstream-oh-my-openagent-3.11-plus-audit.md](docs/release/upstream-oh-my-openagent-3.11-plus-audit.md)

## Recommended Companion Plugins

OpenAgent Labforge is strongly recommended together with:

- `opencode-pty`
- `@tarquinen/opencode-dcp`

These are recommendations, not hard dependencies, but they improve the
practical local workflow substantially.

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

### OpenCode install prompt

If you want OpenCode itself to clone this repository, build it, and wire the
local plugin path automatically, you can paste the following prompt into a
fresh OpenCode session:

```text
Clone https://github.com/BOHUYESHAN-APB/openagent-labforge.git into a local working directory on this machine, then install and build it in local-development mode for OpenCode Desktop on Windows.

Requirements:
1. Use Bun, not npm or yarn, for this repository.
2. Run the minimum required install/build steps so the plugin produces dist/index.js successfully.
3. Update %USERPROFILE%\.config\opencode\opencode.json so the plugin array contains the local file plugin entry:
   file:///ABSOLUTE/PATH/TO/openagent-labforge/dist/index.js
4. Preserve any existing useful plugins already in the plugin array unless they are duplicate old entries for this same plugin.
5. If an old npm-installed entry for openagent-labforge or oh-my-opencode exists, replace it with the local file entry instead of keeping duplicates.
6. Do not overwrite unrelated provider or model config.
7. At the end, show:
   - the clone path
   - the exact build command(s) you ran
   - the final plugin array from opencode.json
   - whether an OpenCode Desktop restart is required

If Bun is missing, stop and tell me exactly what to install first.
```

For users who only want to clear stale session residue rather than reinstall:

- run `/focus-chat` to return the current session to ordinary chat mode
- run `/workflow-reset` if the session still carries old execution state

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

## Deferred Work

The following are intentionally not treated as fully complete yet:

- model-family-specific prompt overlays for more non-default families such as
  GLM, Kimi, and DeepSeek
- the full image execution bus

Current image-bus stance:

- it is configuration-gated
- it is not treated as on by default
- if no backend is configured, the current document flow should stay SVG-first
  instead of pretending image generation is available

Planned future image-bus targets include:

- Google Nano Banana style backends
- ComfyUI-compatible backends
- optional generated-image review by the main model

## Contribution Note

Maintainer note:

- multi-contributor Git merge work may sometimes take extra time
- the maintainer is not especially fluent in complex multi-party Git conflict
  resolution workflows
- in some contribution windows, AI-assisted merge review or conflict handling
  may be used before merge completion

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
