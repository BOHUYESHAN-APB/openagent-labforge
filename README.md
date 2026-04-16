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

### Strong Practical Recommendation

For serious autonomous use, especially:

- `wase`
- `bio-autopilot`
- `bio-orchestrator`
- long-running engineering sessions
- long-running bioinformatics sessions

prefer models with **more than 500K effective context** whenever possible.

Practical rule:

- below ~400K: use with caution for deep autonomous sessions
- ~500K and above: strongly recommended
- ~1M and above: best experience for long-running auto / bio sessions

Why this matters:

- the model may generate large summaries on its own
- repeated compaction can happen with very short gaps between real work waves
- lower-context provider variants of the "same" model family can behave very differently

Example:

- some provider variants of Gemini may expose much less context than the model family suggests
- do not assume provider A and provider B offer the same practical context window for the same model name

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
- batch-mode autonomous sessions now stop cleanly after an approved reviewed
  wave instead of auto-rolling into another wave
- stale todo graphs from a previously approved batch are treated as stale when a
  fresh user wave starts
- completion claims that also declare concrete same-scope "next wave / next
  step" work are now treated as pseudo-completion and pushed back into a new
  execution wave instead of being accepted at face value

Mode selection is runtime-scoped and stored in the repo-local workflow state.

### Fresh repo bootstrap

When the user enters one of the two auto modes in a git-backed repo that still
looks like an initialization-stage repository, the plugin can now ask a single
bootstrap question before substantial execution begins.

This bootstrap gate is intentionally narrow:

- only for the two auto modes
- only on the first user turn of a fresh session
- only for git-backed repos that still look very early
- skipped when the user already specified the engineering system explicitly
- skipped for fork/resume/checkpoint-carry sessions that already have runtime
  posture state

The selected posture is persisted at:

- `.opencode/openagent-labforge/bootstrap/current.json`

and then reloaded as a lightweight persistent context block for later waves and
resumed sessions.

Current engineering bootstrap presets:

1. `product workspace`
2. `library / plugin / SDK`
3. `backend / service / tooling`
4. `documentation / knowledge-base`
5. `research / prototype / spike`
6. `bootstrap-first scaffold` (recommended)
7. `let AI derive the repo posture`
8. `custom project posture`

Current bio bootstrap presets:

1. `mainline material pack` (recommended)
2. `bio dry-lab pipeline`
3. `literature / evidence synthesis`
4. `bio figure / submission assets`
5. `lightweight exploratory proof`
6. `bootstrap-first bio scaffold`
7. `let AI derive the repo posture`
8. `custom project posture`

Practical reply examples for the first bootstrap question:

- `6`
- `1,4`
- `7`
- `8: build this repo as a plugin-first SDK with docs in root README and deep design notes kept private`

When the user chooses `let AI derive the repo posture`, the fork expects the
auto agent to infer the posture from a fixed scale rather than free-form vibes:

- repo main type
- primary deliverable
- execution rhythm
- artifact organization
- verification intensity
- user involvement level
- default question policy

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

The current cleanup commands are especially useful after:

- switching a session out of auto mode
- carrying old todos into a fresh user wave
- recovering from a long or over-continued reviewed batch

### Checkpoint handoff commands

The fork now also includes repo-local checkpoint commands for long-running work
that should continue in a fresh session instead of stretching one chat
indefinitely.

Current checkpoint commands:

- `/handoff`
- `/compress-context`
- `/checkpoint`
- `/checkpoint-resume`

Practical intent:

- `/handoff` creates an inline continuation summary for manual copy/paste into a
  new session
- `/compress-context` is a runtime context-management command for the CURRENT
  session:
  - `status`: inspect current compression state
  - `auto`: choose the appropriate level automatically
  - `l1`: request native OpenCode-style summarize/compaction and show only a
    short summary
  - `l2`: reinforce repo-local runtime memory for the same session
  - `l3`: prepare a heavy cross-session checkpoint without automatically
    switching sessions
- `/checkpoint` writes a repo-local checkpoint under
  `.opencode/openagent-labforge/checkpoints/` so the next session can resume
  from file instead of old chat history
- `/checkpoint-resume` loads the latest or specified checkpoint and rebuilds the
  next execution wave in the current session

Command split:

- `/compress-context` is operational compression and runtime-memory management
- `/checkpoint` is an explicit durable handoff artifact
- `/compress-context` may refresh auto-checkpoint files under
  `.opencode/openagent-labforge/checkpoints/auto/`, but it does NOT replace an
  explicit `/checkpoint` when the user wants a deliberate human-reviewed handoff

Compression levels:

- `L1`: native summarize request plus visible short summary, without printing
  the compacted context body
- `L2`: local runtime reinforcement via repo-local files such as
  `context-capsule.md` and `context-pressure.json`
- `L3`: heavy checkpoint preparation for likely cross-session continuation; it
  recommends a fresh session but does not auto-switch

Checkpoint files now also carry compact execution posture, not just prose
summary:

- artifact policy
- active work item
- bootstrap / repo posture

That means a resumed session can recover:

- where outputs should continue
- whether the repo is running as a material pack, scaffold, docs repo, etc.
- which engineering posture was selected during fresh-repo bootstrap

without rereading the entire old session or broad output tree.

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

The skill system has two bundled forms:

- TypeScript built-in skills: high-frequency, always-packaged skills maintained
  in source code
- file-backed skills: `SKILL.md` directory bundles shipped under
  `generated/skills-bundles/`

Both forms ship with the plugin package. Users do not need to install the
bundled skills separately.

The rule of thumb is:

- keep high-frequency operational skills as TypeScript built-ins
- keep large, fast-growing domain catalogs as file-backed bundles
- load heavy file-backed details on demand through the `skill` tool

Current file-backed bundles:

- `full`: general engineering / writing / research bundle
- `paper`: paper-writing focused bundle
- `bio`: full bioinformatics catalog bundle

The `bio` bundle is generated from the imported bioSkills tree plus Labforge's
own bio wrappers. It is committed under:

- `generated/skills-bundles/bio/`

This bundle is intended to be committed so cloud builds and release automation
do not depend on local-only generated skill state.

### TypeScript built-in skills

The TypeScript built-in skill set now covers both general and bio workflows.

Examples:

- browser / UI / git:
  - `playwright`
  - `frontend-ui-ux`
  - `backend-architecture`
  - `git-master`
  - `skill-creator`
  - `mcp-builder`
- document / report:
  - `docx-workbench`
  - `pdf-toolkit`
  - `pptx-studio`
  - `proposal-and-roadmap`
  - `doc-coauthoring`
  - `internal-comms`
  - `brand-guidelines`
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

### File-backed bioinformatics skills

The bioinformatics file-backed bundle uses a directory-first routing mechanism.

Root entry:

- `research/bioinformatics`

Routing pattern:

1. load `skill(name="research/bioinformatics")`
2. choose and load a category guide, for example:
   - `research/bioinformatics/read-qc`
   - `research/bioinformatics/read-alignment`
   - `research/bioinformatics/rna-quantification`
   - `research/bioinformatics/pathway-analysis`
   - `research/bioinformatics/variant-calling`
   - `research/bioinformatics/genome-annotation`
   - `research/bioinformatics/single-cell`
3. load the narrowest leaf skill, for example:
   - `research/bioinformatics/read-qc/fastp-workflow`
   - `research/bioinformatics/read-alignment/star-alignment`
   - `research/bioinformatics/rna-quantification/featurecounts-counting`
   - `research/bioinformatics/pathway-analysis/gsea`
   - `research/bioinformatics/variant-calling/gatk-variant-calling`
   - `research/bioinformatics/genome-annotation/prokaryotic-annotation`

The leaf skills are intentionally file-backed and loaded on demand. This avoids
front-loading hundreds of detailed bioinformatics workflows into the prompt
while still shipping them as part of the plugin package.

Labforge's TypeScript bio skills are also exposed through the generated
`research/bioinformatics/labforge-core` wrapper category, so bio agents can use
one directory-style route even when the final target is a TypeScript built-in
skill such as `bio-tools`, `bio-methods`, or `bio-pipeline`.

Bio agents now carry explicit instructions to treat file-backed skill loading
as setup for substantial bioinformatics work:

- broad or modality-specific bio work should start at
  `research/bioinformatics`
- category guides should be loaded before leaf skills
- leaf skills should be invoked and used, not merely named from memory

The newer general-purpose additions are meant to strengthen:

- reusable skill authoring
- MCP server design and evaluation
- long-document collaboration
- internal communication quality
- cross-surface brand consistency

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
- audience / tracking / publish-target routing for docs and writing work

This is intentionally source-first:

- source material and manifests are tracked in the document workspace
- binary outputs remain generated artifacts

Current figure policy:

- the document flow is currently SVG-first
- when a figure is needed and no image-bus backend is configured, the system
  should insert SVG placeholders or SVG-derived figures first
- users can replace those later with final generated or manually refined figures

Current document workspace routing rules:

- public open-source docs can be routed as `repo-docs`
  examples:
  - `README.md`
  - `docs/<name>.md`
- internal notes, design docs, private user-facing drafts, and confidential
  handoff material should default to repo-local workspace storage under
  `.opencode/openagent-labforge/runtime/.../documents/`
- document-oriented skills can now carry:
  - `audience=public-reader|internal|end-user`
  - `tracking=repo-tracked|workspace-git|ephemeral`
  - `publish_target=repo-docs|workspace-private`
  - `target_path=README.md|docs/<name>.md`

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
bun run build
bun pm pack
```

`bun run build` now also generates the bio skill bundle through
`build:bio-skills-catalog`.

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
