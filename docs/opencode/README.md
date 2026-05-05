# OpenCode Plugin Guide

OpenCode is the primary full-runtime host for OpenAgent LabForge.

Chinese version: [`README.zh-CN.md`](README.zh-CN.md)

## Status

The OpenCode integration is a real plugin:

- registers agents and display names;
- registers plugin tools and MCP definitions;
- intercepts hook-driven slash commands;
- manages checkpoints, todo continuation, plan workflow, and runtime state;
- owns project state under `.opencode/openagent-labforge/`.

## Current repository name

The current GitHub repository is still `openagent-labforge-bio` for historical
release continuity. The package/product name is `openagent-labforge`, and future
repository migration should remove `-bio` after bio becomes a discipline pack.

## Command prefix

Use `ol-` commands in user-facing docs and workflows:

- `/ol-start-work`
- `/ol-preset`
- `/ol-auto-continue`
- `/ol-interview`
- `/ol-karpathy`

Some legacy hook-driven inputs may still be accepted for compatibility, but they
should not be the primary documented interface.

## Internal IDs vs display names

The OpenCode adapter keeps internal IDs stable for compatibility:

| Display name | Internal ID |
|--------------|-------------|
| `engineer` | `orchestrator` |
| `planner` | `prometheus` |
| `executor` | `atlas` |
| `bio-analyst` | `bio-orchestrator` |
| `requirements-analyst` | `metis` |
| `plan-reviewer` | `momus` |

Do not rename internal IDs casually; historical sessions, config, presets,
checkpoints, and boulder state may still refer to them.
