# Features Reference

This is the current feature summary for OpenAgent Labforge after the MCP, delegation, writing-agent, and release-surface cleanup work.

---

## Agent System

### Core execution agents

- `sisyphus` - main orchestrator
- `hephaestus` - deep coding / GPT-style execution path
- `prometheus` - planning
- `atlas` - execution coordinator
- `sisyphus-junior` - category-based delegated executor

### Specialist agents

- `explore` - local codebase discovery
- `librarian` - one upstream library/framework/SDK question
- `github-scout` - repository comparison and study shortlists
- `tech-scout` - ecosystem / benchmark / launch synthesis
- `article-writer` - public-facing technical writing
- `scientific-writer` - peer-facing scientific writing
- `multimodal-looker` - screenshot / PDF / image analysis
- bio-oriented specialists remain available where configured

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

- `open_websearch_mcp` replaced the old Bing-specific MCP path
- `paper_search_mcp` was reverted to the launcher path that actually works in this environment
- background-session fallback-chain registration now matches sync-session behavior
- retry handling was hardened against stale provider-cache filtering
- MCP OAuth callback server bind logic is more robust
- bash null-byte stripping now prevents malformed command payloads
- writable data/cache fallback exists for bad environment paths

---

## Release-Surface Cleanup Status

Already cleaned:

- root README variants
- installation guide
- package/repository metadata
- CLI/TUI installer visible branding
- schema metadata

Still a later-phase concern:

- broader non-critical doc harmonization
- final public release/publish workflow polish
