# Upstream Sync Guide

> 最后更新: 2026-06-03

## 概述

我们的插件通过 OpenCode 的 **Plugin Hooks API** 与上游交互，不依赖内部实现。这使得上游更新时，我们只需要关注 hook 签名变化。

## 我们使用的上游 API

### 稳定的 Plugin Hooks

| Hook | 用途 | 文件 |
|------|------|------|
| `experimental.session.compacting` | 替换压缩提示词 | `src/hooks/compaction/index.ts` |
| `chat.message` | 压缩后注入恢复指令 | `src/hooks/compaction/index.ts` |
| `experimental.chat.messages.transform` | 消息转换（备用） | — |
| `command.execute.before` | 命令拦截 | `src/index.ts` |
| `experimental.chat.system.transform` | 系统提示词注入 | `src/index.ts` |

### 我们独立实现的功能

| 功能 | 依赖 | 文件 |
|------|------|------|
| Checkpoint 系统 | 无 | `src/checkpoint/` |
| Context Pressure 监控 | 无 | `src/context-pressure/` |
| Compaction 提示词 | Hook API | `src/hooks/compaction/prompt.ts` |

## 上游更新检查流程

### 1. 拉取上游最新代码

```bash
git -C Future/opencode-dev pull origin main
```

### 2. 运行同步检查脚本

```powershell
./scripts/sync-upstream.ps1
```

### 3. 检查关键文件变化

```bash
# 检查 Plugin API 变化
diff Future/opencode-dev/packages/plugin/src/index.ts.bak Future/opencode-dev/packages/plugin/src/index.ts

# 检查 Compaction 逻辑变化
diff Future/opencode-dev/packages/opencode/src/session/compaction.ts.bak Future/opencode-dev/packages/opencode/src/session/compaction.ts
```

### 4. 应对策略

| 变化类型 | 影响 | 操作 |
|----------|------|------|
| Hook 签名变化 | 低 | 更新类型定义，重新编译 |
| Compaction 逻辑变化 | 中 | 检查是否需要更新 prompt |
| 新增 Hook | 无 | 可选采用 |
| 删除 Hook | 高 | 需要找替代方案 |

## 我们的架构优势

```
上游 OpenCode
    │
    ├── Plugin API（稳定）← 我们使用这个
    │   ├── hooks
    │   ├── tools
    │   └── config
    │
    └── Internal API（不稳定）← 我们不使用
        ├── session/compaction.ts
        ├── agent/agent.ts
        └── ...
```

**关键原则**：
1. 只使用 Plugin API，不依赖内部实现
2. Checkpoint 系统完全独立，不受上游影响
3. Compaction 提示词通过 hook 注入，不修改上游代码

## 上游 Compaction 逻辑

上游的 compaction 流程：

```typescript
// packages/opencode/src/session/compaction.ts:394-400
const compacting = yield* plugin.trigger(
  "experimental.session.compacting",
  { sessionID: input.sessionID },
  { context: [], prompt: undefined },
)
const nextPrompt = compacting.prompt ?? buildPrompt({ previousSummary, context: compacting.context })
```

**关键点**：
1. 如果我们设置 `output.prompt`，上游的 `buildPrompt()` 不会被调用
2. 如果我们只添加 `output.context`，上游会保留 `previousSummary` 逻辑
3. 我们选择设置 `output.prompt`，所以需要自己处理 `previousSummary`

## 同步检查清单

- [ ] Plugin API 签名是否有变化
- [ ] Compaction 逻辑是否有变化
- [ ] 新增的 hooks 是否需要采用
- [ ] 我们的 prompt 是否需要更新
- [ ] Checkpoint 系统是否仍然独立
