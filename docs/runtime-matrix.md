# Runtime Compatibility Matrix

ExtendAI Lab treats host runtimes differently based on their real extension
surface. The first compatibility-installer milestone should focus on the three
mainstream runtimes with the strongest plugin ecosystems, then add limited
agent/skill/MCP adapters for the rest.

## Priority tiers

| Tier | Runtimes | Installer target | Notes |
|------|----------|------------------|-------|
| Tier 1 — full plugin compatibility | OpenCode, OpenClaude, Codex | Full plugin or near-full capability renderer | Immediate open-source-first focus. Plan hooks, agents/subagents, skills, MCP, commands, and runtime configuration as first-class surfaces. |
| Tier 1.5 — same-family later target | Claude Code | Reuse the Claude-family renderer after the open-source baseline is stable | Closed-source Claude compatibility stays after OpenCode + OpenClaude + Codex. |
| Tier 2 — limited adapter | DeepSeek-TUI, GitHub Copilot CLI | Conservative command/skill/MCP/instruction pack | Useful later targets, but harder to map to full hook/subagent parity. Treat plugin support as runtime-specific and detection-gated. |
| Tier 3 — rules / modes / MCP | Cline, RooCode, KiloCode | Agent/checklist prompts, skills, MCP, rules, custom modes where supported | Do not promise full plugin, hook, or subagent lifecycle compatibility. |

## Priority reference paths

Keep these local repositories as the highest-priority reference set while the
compatibility layer is being expanded:

- `Future\\oh-my-claudecode`
- `Future\\claudecode-main`
- `Future\\codex`
- `Future\\oh-my-codex`
- `Future\\oh-my-openagent`
- `Future\\oh-my-opencode-slim`
- `Future\\openclaude`

Use them as architecture references, surface maps, and install-shape examples.
Do not treat license-restricted projects as copy sources.

## Immediate implementation order

1. OpenCode
2. OpenClaude / open-source Claude-family surface
3. Codex
4. Closed-source Claude Code through the same Claude-family renderer later

This order reflects the current product rule: serve the three open-source coding
CLIs first, keep Codex as a core target even though it is Rust-heavy, and delay
closed-source Claude compatibility until the open-source baseline is stable.

## Phase 1 targets

### OpenCode

OpenCode remains the native runtime. It supports the complete ExtendAI Lab
surface today:

- plugin bootstrap and config mutation
- agents and subagents
- hook transforms and command handlers
- MCP registration
- bundled tools and skills
- checkpoint, memory, todo-continuation, and context-pressure behavior

Reference implementations to keep in view:

- `Future/oh-my-openagent-dev` is a mature OpenCode plugin/CLI installer
  example. It uses an install-time config writer, schema generation, doctor
  checks, model fallback resolution, and OpenCode hook/agent/tool wiring.
  ExtendAI Lab should borrow the installation architecture pattern, not its
  license-restricted code.

### OpenClaude first, Claude Code later

OpenClaude is the first Claude-family compatibility target because it preserves
the open-source-first product rule while still exposing a strong plugin surface.
Closed-source Claude Code should reuse the same renderer family later, after the
OpenCode + OpenClaude + Codex baseline is stable.

Reference paths to keep nearby:

- `Future\\openclaude`
- `Future\\oh-my-claudecode`
- `Future\\claudecode-main`

The installer should render ExtendAI Lab capabilities as Claude/OpenClaude
plugin assets rather than pretending the OpenCode plugin can run there
unchanged.

Programmatic SDK/API entrypoints:

- OpenClaude: `@gitlawb/openclaude/sdk` (community OpenClaude SDK subpath).
  Main entrypoints include `query()`, session helpers, and SDK MCP helpers such
  as `createSdkMcpServer()`.
- Claude Code: `@anthropic-ai/claude-agent-sdk` (official; formerly Claude
  Code SDK). Main entrypoint: `query()`. Keep this in the same family but later
  in delivery order.

### Codex

Codex is also a first-class target, but its mapping must follow Codex-specific
docs and repository behavior. Prioritize skills, AGENTS-style instructions,
MCP configuration, and any plugin surfaces Codex exposes explicitly.

Programmatic SDK/API entrypoint:

- Codex: `@openai/codex-sdk` (official TypeScript SDK). Main export: `Codex`.
  It wraps the `@openai/codex` CLI, starts/resumes persisted threads, and
  exchanges JSONL events over stdin/stdout.

Reference implementation:

- `Future/oh-my-codex` is MIT licensed and provides a practical Codex plugin
  shape: `.agents/plugins/marketplace.json` points to
  `plugins/oh-my-codex`, whose `.codex-plugin/plugin.json` declares bundled
  `skills`, `mcpServers`, and `apps`. Its setup flow also installs Codex skills
  under `$CODEX_HOME/skills` or project `.codex/skills`, prompt assets, native
  agents under `.codex/agents`, managed `AGENTS.md` overlays, `.codex/hooks.json`,
  and `.omx/` runtime state. ExtendAI Lab's Codex renderer should start with
  the plugin manifest + skills/MCP/apps shape, then add native Codex setup only
  behind explicit install-plan and backup/rollback steps.

Additional local references to keep in view:

- `Future\\codex`
- `Future\\oh-my-codex`

## Later targets

### DeepSeek-TUI

DeepSeek-TUI is valuable but harder. Keep it as a conservative adapter target:

- command packs
- skill packs
- MCP configuration
- shared-prefix snapshot instructions
- runtime-specific config where available

Do not claim full OpenCode-style hook/subagent compatibility unless the host
runtime exposes equivalent lifecycle APIs.

### GitHub Copilot CLI

Copilot CLI has MCP, skills, slash commands, and plugin-related surfaces, but it
should stay in the limited-adapter tier until those surfaces are verified as
stable enough for ExtendAI Lab capabilities.

### Cline and RooCode

Cline and RooCode should be treated as one family. RooCode is a Cline fork, so
their compatibility work should share a renderer when possible.

Expected install surface:

- rules / custom instructions
- agent checklist prompts
- skills if supported
- MCP configuration

Do not promise full subagent or hook parity.

### KiloCode

KiloCode is related to OpenCode historically but learned heavily from the Cline
ecosystem and does not currently provide the same complete plugin ecosystem as
OpenCode.

Treat it as its own limited target:

- skills
- custom modes / rules where available
- MCP configuration
- agent/checklist prompt packs

## Installer design implications

The compatibility installer should always produce an install plan before it
writes files. Each target renderer should declare which capability level it can
support:

- `full-plugin`: full or near-full plugin renderer for Tier 1 runtimes
- `limited-adapter`: runtime-specific command/skill/MCP/instruction adapter
- `rules-mcp`: rules, modes, skills, and MCP only
- `infrastructure`: support service such as shared-context-server, not an agent
  runtime

SDK packages should be treated as optional compatibility providers rather than
hard runtime dependencies of the OpenCode plugin. The installer can probe for
them and explain how to install missing SDKs, but normal OpenCode installation
must not force users to download Codex or Claude runtime binaries.

Every install plan should include:

- detected runtime and config paths
- capability support and downgraded capabilities
- files to write
- files to back up
- rollback manifest path
- reload/restart requirements

Implementation rule for the unified compat CLI:

- follow a clear `doctor -> install-plan preview -> apply -> validate -> rollback` lifecycle;
- keep `doctor` and `status` safe, read-only, and runtime-filterable with
  `--runtime=<id>`;
- keep install flows dry-run first until the apply path is explicit and backed
  by manifest + backup logic;
- treat rollback the same way: `rollback --runtime=<id> --manifest=<path>` should first show a dry-run restore preview before any real restore/apply step exists;
- prefer plan/apply separation similar to the stronger installer discipline seen
  in agent-harness-style selective installs and Hermes-style explicit state
  boundaries.

## Host-neutral memory and evolution baseline

Before any runtime-specific memory integration is treated as complete, ExtendAI
Lab should keep a shared baseline that is portable across OpenCode,
Claude/OpenClaude, and Codex:

- **raw history** stays large, lossy, and short-lived; it is useful for replay or
  debugging, but it should not become permanent behavior by default.
- **memory capsules** are compact, attributed records with provenance, scope,
  confidence, validation status, tags, and rollback ids. Capsules are the unit of
  durable cross-session learning.
- **promoted behaviors** are reviewed, reversible rules derived from capsules.
  They affect future behavior only after validation and should remain cheaper to
  disable or delete than to create.

Minimum capsule fields should include:

- source kind (`checkpoint`, `review`, `manual`, `auto`, `tool`, `migration`)
- scope (`session`, `workspace`, `repository`, `global`)
- confidence (0..1)
- validation status (`unverified`, `tested`, `reviewed`, `user-confirmed`, `rejected`)
- provenance (`sessionID`, `conversationID`, `workspaceRoot`, `repositoryId`, timestamps)
- rollback id for later disable/delete/revert workflows

Promotion rule:

- unverified or rejected capsules must not become behavior automatically;
- promotion should require adequate confidence plus at least one validation lane
  such as tests, review, or explicit user confirmation;
- session-scoped capsules may be promoted only by widening scope explicitly
  (for example `session -> workspace`) instead of silently becoming global.

## Foundation architecture baseline

Before wiring Claude/OpenClaude or Codex SDKs into real execution flows, the
compatibility layer should stabilize these host-neutral building blocks:

- `document-output`: all generated plans, specs, handoffs, review reports,
  install plans, and rollback manifests must be written through a host-owned save
  service that returns a real receipt. Agents must not claim saved files from
  chat-only output.
- `capability contract`: each runtime capability has required inputs,
  validation, and fallback/degradation behavior. Missing capabilities are
  explicit, not silently emulated.
- `runtime adapter`: every runtime adapter implements detect, assess,
  plan-install, validate, and rollback. Claude/OpenClaude and Codex start as
  dry-run skeletons until their renderers are ready.
- `install plan`: installers produce a dry-run plan before writes, including
  managed files, warnings, required backups, reload/restart needs, and rollback
  manifest path.
- `backup/rollback`: runtime installs must be reversible and must only touch
  ExtendAI Lab-managed files by default.

Current degradation baseline:

- `subagents -> main-only/checklists`
- `hooks -> commands/manual workflow`
- `mcp -> builtin-only tools`

SDK/API providers are allowed to help detection or execution, but they must sit
behind this abstraction layer. They should not directly control the architecture.

## Harness and native-helper policy

Several `oh-my-*` projects and upstream runtimes are adding harness layers.
ExtendAI Lab should treat those as references, not as architecture to clone.

Product rule:

- Do not build a second full runtime harness unless a host exposes no safer
  extension surface and the user explicitly opts into that cost.
- Keep the compatibility layer centered on install plans, renderers,
  backup/rollback, SDK probing, MCP configuration, and host-native plugin/skill
  assets.
- Do study harness memory design separately. The valuable part is often not the
  execution wrapper, but cross-session state: durable memory, mailbox-style
  handoff, replay, snapshots, and searchable context that survives fresh agent
  sessions.
- Rust or other native code is acceptable only as a small leaf helper for clear
  hotspots: fast skill/file indexing, local search, process/path probing, or
  Codex-style shell/explore acceleration.
- Native helpers must be optional. They should not own durable state, bypass the
  TypeScript installer, or block the normal TS-only path when unavailable.

`Future/oh-my-codex` is the useful reference here: its Rust pieces are worth
studying for local acceleration patterns, while the main migration lesson remains
the Codex plugin/skills/MCP/app layout and conservative setup boundaries.

Useful Rust reference boundaries from `oh-my-codex`:

- `crates/omx-sparkshell`: executes direct argv or captures tmux pane tails,
  then summarizes oversized output. This is a good leaf-helper pattern for
  output shaping, not a reason to move orchestration out of TypeScript.
- `crates/omx-explore`: runs a Codex-backed read-only exploration harness with
  allowlisted shell commands and model fallback. Borrow the allowlist/fallback
  shape only if a host lacks safer built-in search tools.
- `crates/omx-mux`: wraps tmux target resolution, send-input, capture-tail, and
  liveness contracts. ExtendAI Lab already has tmux utilities, so this is a
  design reference rather than a new dependency.
- `crates/omx-runtime-core` / `omx-runtime`: provide authority, dispatch,
  mailbox, replay, and snapshot mechanics. Treat this as a full runtime harness
  and avoid cloning it into ExtendAI Lab. However, its memory-facing concepts are
  worth extracting into our own architecture: cross-session capsules, mailbox or
  handoff queues, replayable summaries, and checkpoint-linked snapshots should
  remain possible as storage/service features without adopting the full harness.

For ExtendAI Lab, the preferred memory direction is a host-neutral memory layer:

- local checkpoint/memory remains the default baseline;
- optional shared-context MCP or similar services can provide multi-agent shared
  sessions;
- future native memory capsules should be portable across OpenCode,
  Claude/OpenClaude, and Codex renderers;
- memory features must stay decoupled from any one runtime harness so that
  backup/rollback, schema validation, and install plans remain predictable.

### Agent-harness reference

`RyanMoultrup/agent-harness` should be treated as a formal architecture
reference for agent memory, evolution, evaluation, and recoverable runtime state.
It is not just another CLI wrapper.

Useful ideas to absorb:

- lifecycle memory hooks: `SessionStart`, `PreCompact`, `Stop`, and
  `SessionEnd` as reliable points to load context, preserve state before
  compaction, and persist session learnings;
- selective install architecture: install-plan / install-apply separation,
  installed-content state, incremental updates, and rollback-friendly manifests;
- project/global memory separation: project-hashed observations and instincts,
  with promotion to global only after repeated evidence;
- instinct-style learning: atomic lessons with trigger, action, evidence,
  confidence, scope, provenance, import/export, promote, and evolve flows;
- eval harness concepts: capability evals, regression evals, baselines,
  pass@k/pass^k reliability metrics, and release summaries;
- observer reliability patterns: throttling, tail sampling, sandbox access
  controls, delayed start, and reentrancy guards.

Design boundary: ExtendAI Lab should not copy a monolithic harness wholesale.
Instead, map these ideas into a host-neutral layer that can render into OpenCode,
Claude/OpenClaude, and Codex through their native plugin/skill/hook/MCP surfaces.

### Hermes Agent reference

`NousResearch/hermes-agent` is a different style of reference: a full universal
agent product and runtime rather than an add-on compatibility pack. It is MIT
licensed and has useful architectural ideas, but it should not become the
default architecture for ExtendAI Lab's compatibility installer.

Important Hermes concepts:

- one platform-agnostic `AIAgent` core shared by CLI, messaging gateway, ACP,
  batch runner, API server, and cron jobs;
- SQLite session storage with WAL mode, FTS5 / trigram search, session lineage,
  token/cost metadata, and source tagging across CLI and messaging platforms;
- bounded persistent memory (`MEMORY.md` and `USER.md`) injected as a frozen
  session-start snapshot to preserve prompt-cache stability;
- on-demand session search over full history for long-tail recall instead of
  bloating always-in-context memory;
- pluggable context engines with explicit activation, plus a built-in lossy
  compressor that protects first messages, recent tail, and tool-call groups;
- cache-aware prompt design: stable system prompt, careful message ordering, and
  cache-control breakpoints where providers support them;
- tool registry and toolset system with multiple terminal/browser/web/MCP
  backends;
- messaging gateway, cron jobs, and external memory providers as optional
  product surfaces;
- trajectory compression / RL data generation as research infrastructure.

What ExtendAI Lab should borrow from Hermes:

- SQLite + FTS-style local state for cross-session search, lineage, and cost
  accounting when JSON checkpoint files become too small;
- frozen memory snapshots at session start so memory growth does not break every
  provider prefix cache mid-session;
- small curated always-in-context memory plus searchable long-tail history;
- explicit context-engine interfaces so lossy compression, lossless search, and
  external shared-context services can coexist without one hardcoded strategy;
- source/profile isolation so OpenCode, Claude/OpenClaude, Codex, and later
  adapters do not pollute each other's memory;
- trajectory/eval data capture for future agent evolution and regression tests.

What not to borrow directly:

- the full Hermes runtime/gateway as a dependency;
- twenty-platform messaging gateway scope before the core installer/memory layer
  is stable;
- terminal/browser/tool backend duplication where the host runtime already has
  safe native tools;
- automatic memory growth without the stricter validation and rollback policy
  ExtendAI Lab already applies to preferences.

Hermes suggests a complementary long-term direction: ExtendAI Lab can stay an
installer / renderer / compatibility layer for host runtimes, while adding a
small host-neutral memory and evolution substrate underneath. If that substrate
eventually needs a local service, it should start as optional storage/search/MCP
infrastructure, not as a replacement universal agent shell.

## Agent evolution policy

Cross-session memory should eventually give agents better evolution capability:
they should improve from prior work, not merely remember more text.

Evolution means a controlled loop:

1. Capture experience: decisions, failures, fixes, validation results, user
   preferences, and reusable workflows are stored as structured memory capsules.
2. Evaluate usefulness: repeated success, explicit user approval, tests, reviews,
   or post-task outcomes decide whether a memory is valuable.
3. Promote carefully: useful memory can become a preference, checklist, skill
   note, runtime-specific renderer rule, or repository/workspace memory.
4. Keep provenance: every promoted behavior should record source session,
   reason, timestamp, scope, and confidence.
5. Support rollback: users must be able to list, disable, delete, or roll back
   promoted memories and behavior changes.

Evolution does not mean agents may silently rewrite their own system prompt or
global behavior. New behavior should be scoped, inspectable, and reversible. A
bad memory must be cheaper to remove than it was to create.

This evolution layer should be portable across the three first-class runtimes:

- OpenCode can consume it through native checkpoint/memory hooks and system
  transforms.
- Claude/OpenClaude can consume it through plugin skills, commands, hooks,
  memory files, and MCP.
- Codex can consume it through AGENTS instructions, skills, plugin metadata,
  MCP, and shared-prefix snapshots.

Future memory work should therefore separate three concepts:

- raw history: large, lossy, and short-lived;
- memory capsules: compact, attributed, queryable facts or lessons;
- promoted behavior: reviewed changes that affect future agent decisions.

## Product rule

Only OpenCode, OpenClaude, and Codex are the immediate full-compatibility
targets. Closed-source Claude Code follows later through the same Claude-family
renderer. Other runtimes receive conservative agent/skill/MCP/rules
installation without promising hook or subagent mechanism parity.
