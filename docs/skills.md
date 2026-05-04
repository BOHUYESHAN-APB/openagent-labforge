# Skills

Skills are specialized prompt-guidance packages you can assign to agents or load
on demand. Unlike MCPs, which are running servers, skills are instruction bundles
that change **how an agent approaches a task**.

Skills are not the same as `/ol-preset` runtime model presets:

| Concept | Example | Effect |
|---------|---------|--------|
| Runtime preset | `/ol-preset powerful` | Changes agent models/providers/settings |
| Skill / guidance | `/ol-karpathy` or `karpathy-guidelines` | Changes task behavior and review criteria |

OpenAgent LabForge bundles several skills locally. Some can also be installed or
managed through the OpenCode/skills ecosystem, but the bundled skills below ship
with this plugin.

---

## Available Skills

### Recommended (via installer)

| Skill | Description | Assigned to by default |
|-------|-------------|----------------------|
| [`agent-browser`](#agent-browser) | High-performance browser automation | `designer` |

### Bundled in repo

| Skill | Description | Assigned to by default |
|-------|-------------|----------------------|
| [`karpathy-guidelines`](#karpathy-guidelines) | Coding behavior guardrails: think first, keep changes simple, edit surgically, verify goals | On demand via `/ol-karpathy` or skill loading |
| [`simplify`](#simplify) | Behavior-preserving code simplification | `oracle` |
| [`codemap`](#codemap) | Repository codemap generation | `orchestrator` |

---

## karpathy-guidelines

**Behavioral coding guidelines migrated from
[andrej-karpathy-skills](https://github.com/vtroisWhite/andrej-karpathy-skills).**

`karpathy-guidelines` is a bundled skill for reducing common LLM coding mistakes:

1. Think before coding — surface assumptions and ambiguity before editing.
2. Simplicity first — avoid speculative features and unnecessary abstractions.
3. Surgical changes — only touch lines required by the user request.
4. Goal-driven execution — define success criteria and verify them.

There are two ways to use it:

| Method | Use when |
|--------|----------|
| `/ol-karpathy [task-or-review-target]` | You want a user-facing prompt command to apply the guidelines to the current task or review |
| `skill(name="karpathy-guidelines")` | An agent or orchestrator workflow explicitly loads skills |

This skill does **not** switch models or presets. Use `/ol-preset` for runtime model
configuration.

---

## simplify

**Behavior-preserving simplification for readability and maintainability.**

`simplify` is a bundled skill for clarity-focused refactoring without behavior changes. It helps `oracle` reduce unnecessary complexity, improve naming and structure, and keep simplification work scoped and reviewable.

By default, this skill is assigned to `oracle`, which owns code review, maintainability review, and simplification guidance. The `orchestrator` should route simplification requests to `oracle` instead of handling them as a top-level specialty itself.

Source: adapted from Addy Osmani's `code-simplification` skill and bundled locally as `simplify`.

---

## agent-browser

**External browser automation for visual verification and testing.**

`agent-browser` provides full high-performance browser automation. It allows agents to browse the web, interact with page elements, take screenshots, and verify visual state — useful for UI/UX work, end-to-end testing, and researching live documentation.

---

## codemap

**Automated repository mapping through hierarchical codemaps.**

`codemap` empowers the Orchestrator to build and maintain a deep architectural understanding of any codebase. Instead of reading thousands of lines of code on every task, agents refer to hierarchical `codemap.md` files describing the *why* and *how* of each directory.

**How to use:** Ask the Orchestrator to `run codemap`. It automatically detects whether to initialize a new map or update an existing one.

**Why it's useful:**
- **Instant onboarding** — understand unfamiliar codebases in seconds
- **Efficient context** — agents read architectural summaries, saving tokens and improving accuracy
- **Change detection** — only modified folders are re-analyzed
- **Timeless documentation** — focuses on high-level design, not implementation details

See **[Codemap Skill](codemap.md)** for full documentation including manual commands and technical details.

---

## Skills Assignment

Control which skills each agent can use in `~/.config/opencode/oh-my-opencode-slim.json` (or `.jsonc`):

| Syntax | Meaning |
|--------|---------|
| `["*"]` | All installed skills |
| `["*", "!agent-browser"]` | All skills except `agent-browser` |
| `["simplify"]` | Only `simplify` |
| `[]` | No skills |
| `["!*"]` | Deny all skills |

**Rules:**
- `*` expands to all available installed skills
- `!item` excludes a specific skill
- Conflicts (e.g. `["a", "!a"]`) → deny wins (principle of least privilege)

**Example:**

```json
{
  "presets": {
    "my-preset": {
      "orchestrator": {
        "skills": ["codemap"]
      },
      "oracle": {
        "skills": ["simplify"]
      },
      "designer": {
        "skills": ["agent-browser"]
      },
      "fixer": {
        "skills": []
      }
    }
  }
}
```
