# Quick Reference

> This page is an index. Each topic has its own dedicated guide.

## 🚀 Getting Started

| Doc | Contents |
|-----|----------|
| [Installation Guide](installation.md) | CLI flags, `--reset`, auth, troubleshooting |
| [OpenCode Plugin Guide](opencode/README.md) | OpenCode-specific plugin behavior, command prefix, display names |
| [DeepSeek-TUI Adapter Guide](deepseek-tui/README.md) | DSTUI command/skill/MCP adapter boundaries and install safety |

## ✨ Features

| Doc | Contents |
|-----|----------|
| [Council Agent](council.md) | Multi-LLM consensus, presets, role prompts, timeouts |
| [Command System](commands.md) | Prompt-template vs hook-driven commands, `ol-` prefix policy, `/ol-preset` vs `/ol-karpathy` |
| [Interview](interview.md) | `/ol-interview` command, browser UI, dashboard mode, multi-session coordination |
| [Multiplexer Integration](multiplexer-integration.md) | Real-time pane monitoring, layouts, troubleshooting |
| [Plan Workflow](plan-workflow.md) | planner plan files, `/ol-start-work`, executor behavior, boulder resume state |
| [Todo Continuation](todo-continuation.md) | `auto_continue`, `/ol-auto-continue`, cooldowns, safety gates |
| [Preset Switching](preset-switching.md) | `/ol-preset` command for runtime agent model/provider switching |
| [Skills](skills.md) | `karpathy-guidelines`, `simplify`, `codemap` — prompt guidance vs runtime presets |
| [Codemap Skill](codemap.md) | Hierarchical codemap generation |

## ⚙️ Config & Reference

| Doc | Contents |
|-----|----------|
| [Skills](skills.md) | Skill assignment syntax and bundled guidance skills |
| [MCPs](mcps.md) | `websearch`, `context7`, `grep_app` — permissions per agent, global disable |
| [Tools](tools.md) | Background tasks, LSP, code search (`ast_grep`), formatters |
| [Configuration](configuration.md) | Config files, prompt overriding, JSONC, full option reference table |
| [Documentation Refactor Plan](documentation-refactor.md) | Tracks inherited OMO/Slim wording and target LabForge documentation structure |
| [Host Adapter Architecture](architecture/adapters.md) | OpenCode full plugin vs DeepSeek-TUI adapter, Node-compatible TS direction |
| [Discipline Packs](architecture/discipline-packs.md) | Bio as the first optional discipline pack and future science packs |
| [Engineering Modules](architecture/engineering-modules.md) | Reusable prompt-discipline docs such as scientific rigor, anti-overconfidence, and diagnostics strategy |
| [Repository Rename Plan](architecture/repository-rename.md) | `openagent-labforge-bio` historical name and future rename checklist |

## 💡 Author's Setup

| Doc | Contents |
|-----|----------|
| [Author's Preset](authors-preset.md) | The exact config the author runs daily — OpenAI + Fireworks AI + GitHub Copilot |
