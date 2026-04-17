# Orchestration Guide

This guide explains the current OpenAgent Labforge orchestration model after the recent MCP, delegation, and routing cleanups.

---

## Design Goal

The system should do three things well:

1. keep general orchestration with the main agent family
2. use specialist agents only when their boundary is clear
3. create inspectable child sessions when delegation happens

The last point matters operationally: if a delegated task cannot be inspected in the OpenCode UI, it is harder to trust, debug, and continue.

---

## Main Layers

### Planning layer

- `prometheus` - plans and clarifies
- `metis` - finds gaps before work starts
- `momus` - reviews plan quality

### Execution layer

- `sisyphus` - default orchestrator
- `atlas` - structured execution coordinator
- `hephaestus` - deep autonomous coding path

### Specialist layer

- `explore` - local repo search
- `librarian` - one upstream dependency or framework
- `github-scout` - multi-repo comparison and ranking
- `tech-scout` - cross-source ecosystem scans
- `article-writer` - public-facing technical prose
- `scientific-writer` - peer-facing scientific prose
- `multimodal-looker` - visual semantic analysis (PDF / image / figure)

---

## Preferred Delegation Path

When the system wants a real subagent session, the preferred path is:

```text
task(subagent_type=...)
```

Why:

- it produces task metadata and child-session IDs
- it is aligned with OpenCode’s native subagent/session model
- it is the path we now treat as canonical for inspectable delegation

`call_omo_agent` still exists as a compatibility surface, but it is now routed through the same underlying delegation machinery and should not be treated as a separate orchestration philosophy.

---

## Agent Boundary Rules

### Use `explore` when

- the question is about this repository
- the job is grep-heavy local discovery
- you need file paths, patterns, references, or quick codebase mapping

### Use `librarian` when

- the task is about one specific external library, framework, SDK, or upstream implementation
- the answer should come from official docs, source, issues, or version-specific behavior

### Use `github-scout` when

- the real question is “which repos should I study or compare?”
- you need maintainer health, release cadence, adoption signals, and ranked shortlists

### Use `tech-scout` when

- the task spans launches, papers, benchmarks, ecosystem change, or strategic learning priorities

### Use the writing agents when

- `article-writer` -> broad/public technical communication
- `scientific-writer` -> peer-facing scientific or research-style writing

### Use `multimodal-looker` when

- the main question is visual semantics, not literal text retrieval
- you need interpretation of figures, charts, screenshots, or embedded media in office files
- you need image meaning that can drive placement decisions in reports/papers

Do not use `multimodal-looker` as:

- a replacement for plain-text/code exact reads
- a document editing path
- an image generation backend

---

## Search Policy Inside Orchestration

The current intended ordering is:

1. direct repo evidence first (`Read`, `Grep`, diagnostics, AST/LSP tools)
2. `open_websearch_mcp` for broad recall
3. `websearch` for higher-quality precision
4. `context7` for official docs/reference
5. `grep_app` for GitHub implementation examples
6. `paper_search_mcp` when the request is truly academic or citation-sensitive

Do not escalate into multi-agent orchestration by default when simple retrieval answers the question.

---

## Prompt Injection Policy

Keyword-based search/analyze routing still exists, but it has been reduced to lightweight guidance.

The important invariant is:

- if a specialist agent is already explicitly selected, routing injection should not override that choice

That invariant is more important than maximizing autonomous orchestration, because explicit agent choice is stronger evidence of user intent.

---

## Failure Model

When delegation appears broken, ask these in order:

1. Did the agent register and appear in `@` selection?
2. Does `task(subagent_type=...)` create a real child session?
3. Did prompt injection override a specialist that was already explicitly chosen?
4. Is the failure really in the agent, or in the direct-invocation compatibility path?

This sequence prevents chasing the wrong layer.

---

## Practical Recommendation

For high-trust work sessions:

- plan with `prometheus` when scope is unclear
- execute via `task` for inspectable child sessions
- keep specialist prompts narrow and evidence-oriented
- avoid treating every search/analyze request as a reason to launch many agents

For image-generation planning:

- keep generation capability configuration-gated until backend APIs are finalized
- keep SVG-first fallback active while provider API requirements are still being collected

That gives the best tradeoff between transparency, controllability, and throughput.
