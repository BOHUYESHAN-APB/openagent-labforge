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

## Licensing and Copyright Strategy (Refactor Transition)

Starting from commit `2d1addad32aeaec7381bd5502977393000bcc27a`, new code in this
repository is governed as follows:

- Copyright for newly added original code belongs to OpenAgent Labforge
  maintainers/contributors.
- Newly added original code is licensed under Apache-2.0.
- Historical upstream-derived code remains under its source license boundary
  until it is replaced through refactor.

This repository has started a full refactor program to converge the forward code
path to Apache-2.0. See [REFACTOR_APACHE2_PLAN.md](REFACTOR_APACHE2_PLAN.md).

## Current Model Recommendation

**🌟 Strongly Recommended: DeepSeek V4 (Best Value)**

DeepSeek V4 models offer exceptional performance at unbeatable prices:

- **DeepSeek V4-Pro**: T0-tier performance (comparable to GPT-5.4/Claude Opus 4.6)
  - Price: $0.28-0.30/M tokens (20-50x cheaper than competitors)
  - Context: 1M tokens
  - Use for: Main agents, complex reasoning, orchestration
  
- **DeepSeek V4-Flash**: T1-tier performance (completely sufficient for most tasks)
  - Price: ~1/3 of V4-Pro
  - Context: 1M tokens
  - Use for: Subagents, research, code exploration

**Why DeepSeek V4?**
- 🚀 T0-tier reasoning at fraction of the cost
- 💰 Accessible to all users (frequent promotional offers)
- 🎯 Optimized prompts included in this plugin
- 📊 1M context window for large codebases

**Configuration**: Use the built-in TUI settings (`/ol-settings` → Model Selection Settings) to configure DeepSeek as your preferred model for all agents.

### Other Recommended Models

Current project recommendation for manual model choice:

- **Also strongly recommended:**
  - GPT family (GPT-5.4, GPT-4o)
  - GLM family
  - Kimi family
  
- **Also recommended:**
  - Google / Gemini family
  
- **Supported, but not fully re-validated in latest test cycle:**
  - Claude family (note: some users prefer to avoid this provider)

Gemini note:

- in this fork's long-context prompt and tool-routing setup, Gemini is more
  likely to drift into an unexpected language or mixed-language response when
  prompts become very long, especially for users who switch between Chinese and
  English

## Context Window Recommendation

**⚠️ IMPORTANT: Context Guard System v2.0 is now available**

This plugin now includes an advanced multi-tier context guard system optimized for different model context sizes. See [Context Guard Implementation Guide](./CONTEXT_GUARD_IMPLEMENTATION.md) ([中文版](./CONTEXT_GUARD_IMPLEMENTATION_ZH.md)) for details.

### Quick Start

**For 200K models (Claude Haiku, etc.)**: Use `balanced` preset
**For 256K models (Kimi, etc.)**: Use `balanced-plus` preset  
**For 400K+ models**: Use `balanced` or `aggressive` preset

Configure in `.opencode/openagent-labforge.jsonc`:
```jsonc
{
  "experimental": {
    "context_guard_profile": "balanced",  // or "balanced-plus" for 256K
    "preemptive_compaction": true
  }
}
```

Access settings: Type `/ol-settings` → Runtime Settings → Context Guard Settings

### Context Window Tiers

The plugin automatically adjusts compression thresholds based on model context:

- **200K tier** (180K-350K): Optimized for 200K and 256K models
  - Balanced preset: L1@110K, L2@140K, L3@150K
  - Avoids 150K+ issues (1/3 of 200K models have problems after 150K)
  - Plus presets add 30K headroom for 256K models
  
- **400K tier** (350K-900K): For 400K models
  - Balanced preset: L1@150K, L2@220K, L3@300K
  
- **1M tier** (900K+): For 1M+ models (including DeepSeek V4)
  - Balanced preset: L1@220K, L2@320K, L3@550K
  - **DeepSeek V4 Note**: Both V4-Pro and V4-Flash have 1M context and work excellently with the balanced preset

### Model-Specific Context Recommendations

**DeepSeek V4 (1M context):**
- Use `balanced` or `aggressive` preset
- Excellent context utilization efficiency
- Can handle large codebases comfortably
- Recommended for long-running sessions

**GPT-5.4 and similar (400K+):**
- Use `balanced` preset
- Strong performance across all context ranges

**Gemini (varies by provider):**
- Check actual context limit with your provider
- Some provider variants expose less context than advertised
- Use `balanced-plus` for 256K variants

### Legacy Recommendation (Pre-v2.0)

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

**🌟 DeepSeek V4 is ideal for these use cases** with its 1M context window and excellent performance.

Practical rule:

- below ~400K: use with caution for deep autonomous sessions
- ~500K and above: strongly recommended
- ~1M and above: best experience for long-running auto / bio sessions (DeepSeek V4 fits here)

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

### Magic Context - Cache-Aware Context Management

OpenAgent LabForge includes advanced context management inspired by [Magic Context](https://github.com/cortexkit/opencode-magic-context):

- **Cache-aware compression**: Respects Anthropic's prompt cache TTL (default 5 minutes)
- **Tag system**: Precise message references with §N§ tags
- **Cross-session memories**: Project-scoped persistent knowledge
- **Background compression**: Async Historian agent
- **Agent tools**: ctx_reduce, ctx_expand, ctx_memory, ctx_search
- **TUI visualization**: Real-time context breakdown

See [MAGIC_CONTEXT.md](MAGIC_CONTEXT.md) for detailed documentation.

Enable in config:
```jsonc
{
  "experimental": {
    "magic_context": {
      "enabled": true,
      "cache_ttl": "5m",
      "async_compression": true
    }
  }
}
```
- paper cache

This is intended to keep long tasks inspectable and compaction-safe without
spreading temporary state across multiple top-level directories.

### Autonomous execution modes

Autonomous flows now distinguish two levels and two interaction styles:

- two auto mode entrypoints:
  - engineering autonomous mode: `wase`
  - bioinformatics autonomous mode: `bio-autopilot`

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
- in `heavy` mode at the `plan` stage, the flow now injects one explicit
  planning bootstrap first (for example `task(subagent_type="prometheus", ...)`),
  then proceeds to multi-task / multi-agent execution
- `/ol-start-work` follows an explicit-auto routing rule:
  - if the session is already in auto mode, or the request explicitly asks for
    autonomous execution, route to `wase` (engineering) or `bio-autopilot` (bio)
  - heavy signals alone do not force autonomous executors; in non-auto intent
    cases it keeps the standard executor path (`atlas`, fallback `sisyphus`)
- autonomous mode follows a "first primary input + system-driven continuation"
  principle:
  - the user's main task intent is expected mostly in the first prompt
  - subsequent waves are primarily driven by system guidance, auto review, and
    continuation; user follow-up is for directional corrections
  - in autonomous sessions, when planning is approved and tracked execution has
    not started yet, the system now auto-bootstraps a start-work-equivalent
    handoff so the autonomous executor continues execution waves directly
- batch-mode autonomous sessions now stop cleanly after an approved reviewed
  wave instead of auto-rolling into another wave
- stale todo graphs from a previously approved batch are treated as stale when a
  fresh user wave starts
- completion claims that also declare concrete same-scope "next wave / next
  step" work are now treated as pseudo-completion and pushed back into a new
  execution wave instead of being accepted at face value

Mode selection is runtime-scoped and stored in the repo-local workflow state.

`light` vs `heavy` classification sources (not a single signal):

- plan-size signals: checklist/task volume in the active plan file
- plan path/content semantic signals: keywords such as migration,
  architecture, integration, validation, pipeline, bioinformatics
- user request text signals: the current `/ol-start-work` request text is included;
  prompts with multiple heavy-scope signals are more likely to classify as
  `heavy`

Practical shorthand:

- compact scope and short-wave execution usually maps to `light + batch`
- multi-stage, cross-subsystem, long-horizon execution usually maps to
  `heavy + continuous`

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

- `/ol-stop-continuation`
- `/ol-todo-clear`
- `/ol-workflow-reset`
- `/ol-focus-chat`

Native TUI settings commands:

- `/ol-settings`
- `/ol-settings-image-bus`

Practical intent:

- `/ol-stop-continuation` stops continuation mechanisms for the current session
- `/ol-todo-clear` clears stale todos and session-level execution residue
- `/ol-workflow-reset` clears current session workflow state before a fresh tracked
  execution run
- `/ol-focus-chat` returns the current session to ordinary chat mode and suppresses
  stale execution carry-over
- `/ol-settings` opens the plugin's native TUI settings surface
- `/ol-settings-image-bus` opens the image_bus subpage inside that same TUI
  settings flow
- the image_bus page is where relay/proxy URL fields like `generate_endpoint`,
  provider selection, scientific/general routing, and context-memory controls
  belong

Additional clarification:

- these settings commands are no longer implemented as chat template injections
- in TUI, the plugin now registers its own native slash/command UI entrypoints
- manual raw `/ol-settings` messages are intercepted as a safety fallback so the
  command text does not leak to the model

Scope clarification:

- slash commands above are intended for OpenCode TUI slash/command UI
- they are not shell commands and should not be executed in PowerShell

This matters because old todo/workflow state can otherwise leak into later
conversations and make semi-automatic sessions feel heavy or misdirected.

The current cleanup commands are especially useful after:

- switching a session out of auto mode
- carrying old todos into a fresh user wave
- recovering from a long or over-continued reviewed batch

### Context compression optimization

**New in v2.1**: The context compression system has been significantly enhanced with improved compression ratios, version management, and user control.

#### Compression improvements

| Level | Before | After | Improvement |
|-------|--------|-------|-------------|
| L1 | 5-10% | 15-20% | +100% |
| L2 | 15-25% | 30-40% | +60% |
| L3 | 30-40% | 40-50% | +25% |

#### New features

- **L1 compression directives**: L1 now injects lightweight model instructions (previously had none)
- **Checkpoint versioning**: Keeps last 5 global versions and 3 per-session versions
- **Earlier preemptive trigger**: Moved from 90% to 80% usage (10% safety buffer)
- **Compression history**: Tracks last 50 compression events with ratios
- **Manual compression commands**: `/ol-compress` and `/ol-compression-stats`

#### Configuration

Add to `.opencode/openagent-labforge.jsonc`:

```jsonc
{
  "experimental": {
    "context_compression": {
      "micro_prune_threshold": 500,           // Tool output compression threshold (100-5000)
      "enable_duplicate_detection": true,     // Detect duplicate content
      "enable_error_stack_compression": true  // Compress long error stacks
    },
    "checkpoint_retention": {
      "global_keep_count": 5,          // Keep last N global checkpoints
      "per_session_keep_count": 3,     // Keep last N per-session checkpoints
      "session_expiry_days": 7,        // Delete sessions older than N days
      "auto_cleanup": false            // Enable automatic cleanup
    },
    "preemptive_compaction_config": {
      "buffer_ratio": 0.10,      // Safety buffer before L3 (1%-20%)
      "timeout_ms": 120000,      // Compression timeout (30s-300s)
      "retry_on_failure": false  // Retry on compression failure
    }
  }
}
```

#### Manual compression commands

**`/ol-compress [level]`** - Manually trigger context compression

Parameters:
- `auto` (default): Automatically choose level based on usage
  - Usage < 60%: Apply L1 (micro-prune + directives)
  - Usage 60-75%: Apply L2 (micro-prune + light checkpoint)
  - Usage > 75%: Apply L3 (micro-prune + heavy checkpoint)
- `light` / `l1`: Force L1 compression
- `medium` / `l2`: Force L2 compression
- `heavy` / `l3`: Force L3 compression
- `preemptive`: Trigger native session.summarize()

Alias: `/compress`

**`/ol-compression-stats [filter]`** - View compression history and statistics

Parameters:
- No parameter: Show complete statistics
- `l1` / `l2` / `l3`: Filter by compression level
- `recent`: Show only recent 10 events

Alias: `/compression-stats`

Example output:
```
Compression Statistics for Session abc123
================================================

Current State:
- Carried Tokens: 550000 / 1000000 (55%)
- Current Level: L3
- Last Updated: 2026-04-22T12:00:00Z

Compression History (26 events):

By Level:
- L1: 15 events, avg compression: 6.8%
- L2: 8 events, avg compression: 12.9%
- L3: 3 events, avg compression: 14.5%

By Action:
- Micro-prune: 15 events
- Checkpoint: 11 events
- Preemptive: 0 events

Total Tokens Removed: 285000
Time Range: 2026-04-22T10:00:00Z to 2026-04-22T12:00:00Z

Recent Events (last 5):
1. [2026-04-22T12:00:00Z] L3 checkpoint: removed 80000 tokens (14.5%)
2. [2026-04-22T11:30:00Z] L2 checkpoint: removed 60000 tokens (13.2%)
...
```

#### Checkpoint versioning

Checkpoint files are now versioned with rolling retention:

```
.opencode/openagent-labforge/checkpoints/auto/
├── latest.md                    # Latest version (backward compatible)
├── latest.meta.json
├── history/
│   ├── checkpoint-001.md        # Global history (keeps last 5)
│   ├── checkpoint-002.md
│   └── checkpoint-005.md
└── by-session/
    └── <session-id>/
        ├── checkpoint-001.md    # Per-session history (keeps last 3)
        └── checkpoint-003.md
```

Benefits:
- Can revert to previous checkpoint versions
- Automatic cleanup prevents disk bloat
- Session expiry removes old sessions after N days

### Checkpoint handoff commands

The fork now also includes repo-local checkpoint commands for long-running work
that should continue in a fresh session instead of stretching one chat
indefinitely.

Current checkpoint commands:

- `/ol-handoff`
- `/ol-compress-context`
- `/ol-checkpoint`
- `/ol-checkpoint-resume`

Practical intent:

- `/ol-handoff` creates an inline continuation summary for manual copy/paste into a
  new session
- `/ol-compress-context` is a runtime context-management command for the CURRENT
  session:
  - `status`: inspect current compression state
  - `auto`: choose the appropriate level automatically
  - `l1`: request native OpenCode-style summarize/compaction and show only a
    short summary
  - `l2`: reinforce repo-local runtime memory for the same session
  - `l3`: prepare a heavy cross-session checkpoint without automatically
    switching sessions
- `/ol-checkpoint` writes an explicit repo-local checkpoint under
  `.opencode/openagent-labforge/checkpoints/`:
  - `light` (default): compact same-session or short handoff recovery anchor
  - `heavy`: high-fidelity cross-session handoff anchor for long-running work
- `/ol-checkpoint-resume` loads the latest or specified checkpoint and rebuilds the
  next execution wave in the current session

Command split:

- `/ol-compress-context` is operational compression and runtime-memory management
- `/ol-checkpoint` is an explicit durable handoff artifact
- `/ol-compress-context` may refresh auto-checkpoint files under
  `.opencode/openagent-labforge/checkpoints/auto/`, but it does NOT replace an
  explicit `/ol-checkpoint` when the user wants a deliberate human-reviewed handoff
- `/ol-compress-context` and `/ol-checkpoint` intentionally share part of the same
  checkpoint-writing runtime to avoid duplicated logic, but they are still
  different products:
  - auto checkpoint (`checkpoints/auto/`): operational recovery artifacts from
    compression flow
  - explicit checkpoint (`checkpoints/latest.md` and `checkpoints/by-session/*`):
    deliberate handoff artifacts for human-reviewed continuation
- `/ol-checkpoint-resume` can recover from both, preferring explicit checkpoint
  files first, then auto-checkpoint fallback

Compression levels:

- `L1`: native summarize request plus visible short summary, without printing
  the compacted context body. Goal: real context-window pressure drop.
- `L2`: local runtime reinforcement via repo-local files such as
  `context-capsule.md` and `context-pressure.json`. Goal: keep execution
  capability stable after compaction.
- `L3`: heavy checkpoint preparation for likely cross-session continuation; it
  recommends a fresh session but does not auto-switch. Goal: clean handoff for
  long-running work.

Checkpoint levels:

- `light`: fast checkpoint for same-session recovery, short continuation, or
  anti-drift anchor after compaction
- `heavy`: cross-session high-fidelity handoff when the current session is too
  heavy, laggy, or near practical continuation limits

Session-switch policy:

- Compression and checkpoint creation are separate from session switching.
- Automatic L3 can prepare heavy artifacts, but switching sessions should still
  be user-confirmed.
- Manual `/ol-compress-context l3` means the user explicitly requested heavy
  preparation; no extra consent is needed for preparation itself.
- If UI latency or context debt is already hurting execution quality, create a
  heavy checkpoint and continue in a fresh session via `/ol-checkpoint-resume`.

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

### Multimodal-Looker definition and boundary

Purpose:

- maximize semantic understanding of visual/document media
- return extraction-oriented findings to the main agent
- reduce main-session context pressure by isolating heavy multimodal reads

Primary input path:

- `look_at(file_path=..., goal=...)` for local media files
- `look_at(file_path=<directory>, goal=...)` for multi-image folders
- `look_at(file_path=<docx/pptx>, goal=...)` for embedded-media extraction and review

Boundary (what it is not):

- not the default path for plain source/text file literal reading
- not a document editor
- not a standalone image-generation backend

Operational rule:

- if the task is visual semantics (figures, diagrams, screenshot meaning, placement hints), route to `multimodal-looker`
- if the task is literal text/code content extraction, prefer `read`/repo evidence tools first

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

## Installation

### Quick Start (All Platforms)

**IMPORTANT:** OpenCode loads plugins from its local `node_modules`, NOT from global npm installation.

```bash
# Step 1: Clone and build
git clone https://github.com/BOHUYESHAN-APB/openagent-labforge.git
cd openagent-labforge
bun install
bun run build
npm pack

# Step 2: Install to OpenCode's config directory
# Linux/macOS:
cd ~/.config/opencode
# Windows:
cd C:\Users\<YourUsername>\.config\opencode

npm install /path/to/openagent-labforge/bohuyeshan-openagent-labforge-core-<version>.tgz

# Step 3: Verify installation
ls node_modules/@bohuyeshan/openagent-labforge-core  # Should exist

# Step 4: Configure OpenCode
# Edit both config files in ~/.config/opencode/:
# - opencode.json (server plugins)
# - tui.json (TUI plugins)

# opencode.json:
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core@<version>",
    "opencode-pty@0.3.2"
  ]
}

# tui.json:
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core@<version>"
  ]
}

# Step 5: Restart OpenCode completely
```

**Key Points:**
- ✅ Install to `~/.config/opencode/node_modules` (local installation)
- ❌ Do NOT use `npm install -g` (global installation doesn't work)
- ✅ Update BOTH `opencode.json` AND `tui.json`
- ✅ Use package name with version: `@bohuyeshan/openagent-labforge-core@3.15.2`

**Config Directory Locations:**
- Linux: `~/.config/opencode`
- macOS: `~/.config/opencode`
- Windows: `C:\Users\<YourUsername>\.config\opencode`

For detailed installation instructions, troubleshooting, and configuration options, see:

- [docs/guide/installation.md](docs/guide/installation.md)

### TUI settings entry (unified, terminal mode)

When you are developing inside this repository, use:

```bash
bun run src/cli/index.ts settings
```

Back-compat entry (still supported):

```bash
bun run src/cli/index.ts configure
```

Current image-bus focused flow:

```bash
bun run src/cli/index.ts settings --image-bus
```

Useful command checks:

```bash
bun run src/cli/index.ts settings --help
bun run src/cli/index.ts configure --help
```

Google relay/proxy endpoint configuration example:

```jsonc
{
  "image_bus": {
    "enabled": true,
    "context_memory": {
      "enabled": true,
      "carry_prompt_context": true,
      "max_history_turns": 5,
      "include_provider_decision_trace": false
    },
    "providers": {
      "google_nano_banana": {
        "enabled": true,
        "base_url": "https://relay.example.com",
        "generate_endpoint": "/proxy/google/{model}/images",
        "api_key_env": "GOOGLE_API_KEY",
        "model": "nano-banana-2"
      }
    }
  }
}
```

`generate_endpoint` supports both:

- relative paths (joined with `base_url`)
- full URLs (used as-is)

It also supports `{model}` placeholder substitution.

`context_memory` controls how much image-generation context is carried across
chat turns.

### OpenCode Auto-Install Prompt

If you want OpenCode itself to clone, build, and install this plugin automatically, paste this prompt into a fresh OpenCode session:

```text
Clone https://github.com/BOHUYESHAN-APB/openagent-labforge.git into a local working directory, then build and install it for OpenCode.

Requirements:
1. Use Bun for building (not npm or yarn)
2. Run: bun install && bun run build && npm pack
3. Install to OpenCode's config directory:
   cd ~/.config/opencode
   npm install /path/to/bohuyeshan-openagent-labforge-core-*.tgz
4. Update ~/.config/opencode/opencode.json to use the package name:
   "@bohuyeshan/openagent-labforge-core@<version>"
5. Remove any old file:/// entries for this plugin
6. Preserve other existing plugins
7. Show me:
   - Clone path
   - Build commands executed
   - Installation path (should be ~/.config/opencode/node_modules/@bohuyeshan/openagent-labforge-core)
   - Final plugin array from opencode.json
   - Confirmation that OpenCode restart is required

IMPORTANT: Do NOT use "npm install -g" (global install). OpenCode loads plugins from ~/.config/opencode/node_modules, not global npm.

If Bun is missing, tell me how to install it first.
```

For users who only want to clear stale session residue rather than reinstall:

- run `/ol-focus-chat` to return the current session to ordinary chat mode
- run `/ol-workflow-reset` if the session still carries old execution state

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

Image generation integration status (current):

- planned for the next milestone window
- API requirement collection for external generation platforms is still in progress
- until provider API contracts are finalized, the plugin keeps SVG-first fallback behavior as the safe default

## Contribution Note

Maintainer note:

- multi-contributor Git merge work may sometimes take extra time
- the maintainer is not especially fluent in complex multi-party Git conflict
  resolution workflows
- in some contribution windows, AI-assisted merge review or conflict handling
  may be used before merge completion

## Troubleshooting

### TUI Scrollbar Not Visible

If the vertical scrollbar is not visible in the TUI after installing the plugin:

1. **Automatic Fix**: The plugin now automatically enables the scrollbar on first install (v1.15.0+)
2. **Manual Toggle**: Press `Ctrl+K` to open the command palette, then search for "Toggle session scrollbar"
3. **Persistent Setting**: The scrollbar setting is stored in `~/.local/state/opencode/kv.json` as `scrollbar_visible`

Note: OpenCode's default behavior is to hide the scrollbar. This plugin enables it by default for better user experience.

## Docs

- [docs/guide/installation.md](docs/guide/installation.md)
- [docs/guide/orchestration.md](docs/guide/orchestration.md)
- [docs/guide/subagent-orchestration.md](docs/guide/subagent-orchestration.md)
- [docs/guide/subagent-orchestration.zh-cn.md](docs/guide/subagent-orchestration.zh-cn.md)
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
