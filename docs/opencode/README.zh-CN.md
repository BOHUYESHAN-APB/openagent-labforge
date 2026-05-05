# OpenCode Plugin 指南

OpenCode 是 OpenAgent LabForge 的主要完整 runtime 宿主。

英文版本：[`README.md`](README.md)

## 状态

OpenCode 集成是真正的 plugin：

- 注册 agents 和 display names；
- 注册 plugin tools 和 MCP definitions；
- 拦截 hook-driven slash commands；
- 管理 checkpoints、todo continuation、plan workflow、runtime state；
- 项目状态归属 `.opencode/openagent-labforge/`。

## 当前仓库名

当前 GitHub 仓库仍叫 `openagent-labforge-bio`，这是为了历史 release 连续性。package/product 名是 `openagent-labforge`，未来等 bio 拆成 discipline pack 后再迁移 GitHub 仓库名，移除 `-bio`。

## 命令前缀

用户文档和工作流使用 `ol-` 命令：

- `/ol-start-work`
- `/ol-preset`
- `/ol-auto-continue`
- `/ol-interview`
- `/ol-karpathy`

部分旧的 hook-driven 输入可能仍然兼容，但不应作为主要文档接口。

## Internal IDs 与 display names

OpenCode adapter 为兼容性保留内部 ID：

| Display name | Internal ID |
|--------------|-------------|
| `engineer` | `orchestrator` |
| `planner` | `prometheus` |
| `executor` | `atlas` |
| `bio-analyst` | `bio-orchestrator` |
| `requirements-analyst` | `metis` |
| `plan-reviewer` | `momus` |

不要轻易重命名内部 ID；历史 sessions、config、presets、checkpoints、boulder state 可能仍引用它们。
