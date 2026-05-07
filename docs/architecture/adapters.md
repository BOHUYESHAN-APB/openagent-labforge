# Host Adapter Architecture

ExtendAI Lab is moving toward a host-adapter architecture:

- **OpenCode** remains the full runtime plugin host.
- **DeepSeek-TUI** is an adapter target, not a full plugin host.
- Shared behavior should move gradually into host-neutral TypeScript assets.

This document is the English architecture note. See
[`adapters.zh-CN.md`](adapters.zh-CN.md) for the Chinese version.

## Product boundary

The current GitHub repository is still named `openagent-labforge-bio` for
historical reasons. That name reflects the first discipline focus, not the
future product boundary.

Target naming:

- Product / package: `extendai-lab`
- Future GitHub repository: `extendai-lab`
- First optional discipline pack: `bio`
- Current repository name: historical compatibility alias until migration

Do not rename remotes or release tags casually. The safe migration path is:

1. Document the historical `-bio` name.
2. Keep releases working from the current repository.
3. Split bio behavior into a discipline pack.
4. Rename the GitHub repository when install docs, package metadata, redirects,
   and release automation are ready.

## Runtime model

OpenCode and DeepSeek-TUI are not equivalent hosts.

| Capability | OpenCode plugin | DeepSeek-TUI adapter |
|------------|-----------------|----------------------|
| Runtime plugin loading | Yes | No first-class runtime plugin API |
| Agent registration | Yes | Projected via commands/skills |
| Tool registration | Plugin tools + MCP | MCP is the primary external tool path |
| Lifecycle hooks | Typed plugin hooks | Shell hooks from config |
| Slash commands | Plugin command registry | Markdown files in `~/.deepseek/commands` |
| Skills | Plugin-bundled skills | Skill directories + `load_skill` |
| Session control | OpenCode SDK | Optional local HTTP/SSE runtime API |

Therefore LabForge should not pretend to be one universal runtime plugin. The
right model is:

```text
LabForge core assets
  -> OpenCode full plugin adapter
  -> DeepSeek-TUI file/MCP/skill adapter
```

## TypeScript and Node compatibility

LabForge stays TypeScript. Do not rewrite it in Rust unless OpenCode itself
moves to Rust or DeepSeek-TUI exposes a stable Rust plugin API that justifies a
native adapter.

New shared and adapter code should be Node-compatible:

- Prefer Node standard APIs for filesystem, paths, process, crypto, and fetch.
- Avoid adding new `Bun.*` runtime APIs.
- Bun can remain a build/test tool for now.
- Future CI should include a Node smoke check for built CLI output.

## Minimal directory direction

Avoid a big-bang move of `src/index.ts`. Add boundaries first:

```text
src/
  index.ts                    # current OpenCode plugin entry, keep stable
  adapters/
    deepseek-tui/             # file/MCP/skill adapter skeleton
  core/                       # future host-neutral prompt/spec assets
  disciplines/
    bio/                      # future bio discipline pack
```

Later, if the adapter stabilizes, the repository can evolve toward packages:

```text
packages/core/
packages/opencode-plugin/
packages/adapters/deepseek-tui/
packages/mcp-server/
```

## Reusable engineering modules

Host adapters should reuse shared engineering modules where possible instead of
copying large prompt paragraphs across agents.

The first standardized family is documented in:

- [`../engineering-modules/README.md`](../engineering-modules/README.md)
- [`../engineering-modules/scientific-rigor.md`](../engineering-modules/scientific-rigor.md)
- [`../engineering-modules/anti-overconfidence.md`](../engineering-modules/anti-overconfidence.md)

These modules are intended to support staged injection or on-demand loading in
the future, while remaining reviewable as engineering documents today.

## DeepSeek-TUI adapter principle

DeepSeek-TUI currently consumes placed files and external servers:

- user slash commands: `~/.deepseek/commands/*.md`
- skills: workspace/global `SKILL.md` directories
- MCP: `~/.deepseek/mcp.json`
- hooks: `config.toml` shell hooks
- optional runtime API client

Because of that, install/uninstall safety is foundational. Every generated file
must be tracked in a manifest and carry an ownership marker. Uninstall must only
delete files that LabForge owns and that the user has not modified.

## Mode mapping

LabForge owns the mode semantics. Hosts only implement them as best effort.

| LabForge mode | OpenCode mapping | DeepSeek-TUI mapping |
|---------------|------------------|----------------------|
| `plan` | `planner` / plan-only agent | Plan command / skill |
| `agent` | normal permissioned agent | Agent command / skill |
| `auto` | auto-continue + review gate | Agent or weak-YOLO prompt constraints |
| `yolo` | high-autonomy agent with safety boundaries | DSTUI YOLO mode + guardrails |
| `review` | oracle/reviewer/council | review command / skill |
| `bio` | `bio-analyst` discipline pack | bio command / skill pack |

Do not directly reuse OpenCode hooks, task session reuse, or multiplexer logic in
the DeepSeek-TUI adapter.

## Vision capability boundary

DeepSeek-TUI with DeepSeek text models should be treated as text-first. Flash has
no native vision. Visual QA must degrade cleanly:

1. text-only metadata / filenames / SVG source;
2. OCR or PDF text extraction when available;
3. external vision MCP if configured;
4. native image inspection only in hosts/models that support it.

Do not claim DeepSeek-TUI can visually inspect images unless a real vision path
is configured.
