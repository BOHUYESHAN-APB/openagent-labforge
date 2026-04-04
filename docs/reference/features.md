# Features Reference

This is the current feature summary for OpenAgent Labforge after the MCP, delegation, writing-agent, and release-surface cleanup work.

---

## Agent System

### Core execution agents

- `sisyphus` - main orchestrator
- `wase` - fully autonomous orchestrator
- `hephaestus` - deep coding / execution path
- `prometheus` - planner
- `atlas` - execution coordinator and task-state auditor
- `metis` - pre-planning consultant
- `momus` - plan reviewer
- `sisyphus-junior` - category-based delegated executor

### Specialist agents

- `explore` - local codebase discovery
- `librarian` - one upstream library/framework/SDK question
- `github-scout` - repository comparison and study shortlists
- `tech-scout` - ecosystem / benchmark / launch synthesis
- `article-writer` - public-facing technical writing
- `scientific-writer` - peer-facing scientific writing
- `multimodal-looker` - screenshot / PDF / image analysis

### Bioinformatics hierarchy

- main entrypoints:
  - `bio-orchestrator` - integrated bioinformatics coordination
  - `bio-pipeline-operator` - execution-focused bioinformatics delivery
- internal specialists:
  - `bio-methodologist` - study framing, QC, and statistics planning
  - `wet-lab-designer` - user-executed wet-lab validation design
  - `paper-evidence-synthesizer` - literature evidence matrix and confidence grading

### Important current delegation rule

For inspectable child sessions, the preferred path is:

```text
task(subagent_type=...)
```

`call_omo_agent` still exists, but it is now treated as a compatibility wrapper rather than the primary orchestration surface.

---

## Search and Retrieval

The system now distinguishes retrieval roles clearly:

- `websearch` - higher-quality precision search
- `open_websearch_mcp` - broader multi-engine recall
- `paper_search_mcp` - academic retrieval
- `context7` - docs/reference lookup
- `grep_app` - GitHub code examples

The intended policy is tool-first, not agent-first.

---

## Prompt Injection and Routing

The old heavy injected `search-mode` / `analyze-mode` behavior has been reduced.

Current intent:

- keep lightweight routing guidance
- avoid forcing orchestration when direct tools are enough
- do not override explicitly selected specialist agents

This matters because earlier failures were traced to prompt injection oversteering already-chosen specialists.

---

## Skills

Current notable skill behavior:

- OpenCode-style skill discovery is more robust
- metadata validation is stricter
- project-local skill discovery walks upward toward git root
- installer bootstraps `skills/openagent-labforge/SKILL.md`
- first-party bio skills now describe tools, workflows, expected artifacts, and boundary rules

Engineering-oriented skill stack examples:

- `playwright`
- `frontend-ui-ux`
- `git-master`

Bio skill stack examples:

- `bio-tools`
- `bio-methods`
- `bio-pipeline`
- `paper-evidence`
- `bio-visualization`
- `vector-design`

---

## Installer and Local Workflow

Current project reality is still local-first:

1. build locally
2. pack a tgz
3. replace the local tgz in the OpenCode config directory
4. run `bun install`

This is the practical stable path while broader release preparation continues.

---

## Stability Work Completed

Notable engineering stabilizations already landed:

- canonical + legacy config discovery for `openagent-labforge.*` and `oh-my-opencode.*`
- protected builtin-agent registration and upstream-style config handling
- `.opencode/command(s)` ancestor discovery with nested slash command names
- `.agents/skills` participation in command and agent awareness chains
- trimmed MCP surface with redundant built-ins removed
- todo continuation regression hardening for compaction, stagnation, and disposal

---

## Current Engineering Direction

The current core engineering direction is:

- keep child-session delegation inspectable through `task(subagent_type=...)`
- strengthen execution / planning / review contracts in the 7 core engineering agents
- keep Claude/Codex-inspired engineering behaviors modular so future OpenCode overlap can be deduplicated cleanly
