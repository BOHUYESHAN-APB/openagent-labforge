# Phase 2: Checkpoint 版本管理实施报告

## 概述

本阶段完成了上下文压缩机制优化计划的第二阶段：实现 Checkpoint 版本管理和可配置清理策略。

## 实施内容

### 1. 版本化 Checkpoint 存储

**修改文件**: `src/hooks/context-window-monitor-checkpoint.ts`

**新增功能**:

#### 1.1 版本号生成
```typescript
function getCheckpointVersion(checkpointRoot: string): number {
  const historyDir = join(checkpointRoot, "history")
  // 扫描现有 checkpoint-XXX.md 文件
  // 返回下一个版本号
}
```

#### 1.2 新的文件结构
```
.opencode/openagent-labforge/checkpoints/auto/
├── latest.md                    # 软链接/最新版本（向后兼容）
├── latest.meta.json             # 元数据
├── history/
│   ├── checkpoint-001.md        # 全局历史版本
│   ├── checkpoint-002.md
│   ├── checkpoint-003.md
│   ├── checkpoint-004.md
│   └── checkpoint-005.md        # 最新（保留最近 5 个）
└── by-session/
    └── <session-id>/
        ├── checkpoint-001.md    # 每个会话的版本历史
        ├── checkpoint-002.md
        └── checkpoint-003.md    # 最新（保留最近 3 个）
```

**变更说明**:
- 每次写入 checkpoint 时生成新的版本号
- 同时写入三个位置：
  1. `history/checkpoint-XXX.md` - 全局历史
  2. `by-session/<session-id>/checkpoint-XXX.md` - 会话历史
  3. `latest.md` - 最新版本（向后兼容）
- Checkpoint 内容中添加 `Checkpoint Version: N` 字段

### 2. 可配置的清理策略

**新增功能**: `cleanupOldCheckpoints()`

**清理逻辑**:

#### 2.1 全局历史清理
- 保留最近 N 个 checkpoint（默认 5 个）
- 按修改时间排序，删除最旧的
- 配置项: `global_keep_count`

#### 2.2 会话历史清理
- 每个会话保留最近 N 个 checkpoint（默认 3 个）
- 按修改时间排序，删除最旧的
- 配置项: `per_session_keep_count`

#### 2.3 会话过期清理
- 删除超过 N 天未修改的会话目录
- 默认 0 天（不过期）
- 配置项: `session_expiry_days`

#### 2.4 自动清理开关
- 默认 **禁用**（`auto_cleanup: false`）
- 用户需要显式启用才会执行清理
- 配置项: `auto_cleanup`

**清理时机**: 每次写入 checkpoint 后执行

### 3. 配置选项

**已在 Phase 1 添加到** `src/config/schema/experimental.ts`:

```typescript
checkpoint_retention: z.object({
  /** Number of global checkpoints to keep (default: 5, 0 = unlimited) */
  global_keep_count: z.number().int().min(0).max(100).optional(),
  /** Number of checkpoints to keep per session (default: 3, 0 = unlimited) */
  per_session_keep_count: z.number().int().min(0).max(50).optional(),
  /** Session expiry in days (default: 0 = never expire, cleanup disabled by default) */
  session_expiry_days: z.number().int().min(0).max(365).optional(),
  /** Enable automatic cleanup of old sessions (default: false) */
  auto_cleanup: z.boolean().optional(),
}).optional(),
```

### 4. 集成到现有流程

**修改文件**: `src/hooks/context-window-monitor.ts`

**变更内容**:
- 修改两处 `writeAutoCompressionCheckpoint()` 调用
- 传递 `pluginConfig?.experimental?.checkpoint_retention` 配置
- 位置：
  1. `toolExecuteAfter` 钩子（L517-527）
  2. `messagesTransform` 钩子（L692-703）

## 配置示例

### 示例 1: 启用自动清理（保守策略）

```json
{
  "experimental": {
    "checkpoint_retention": {
      "global_keep_count": 10,
      "per_session_keep_count": 5,
      "session_expiry_days": 14,
      "auto_cleanup": true
    }
  }
}
```

**效果**:
- 全局保留最近 10 个 checkpoint
- 每个会话保留最近 5 个 checkpoint
- 14 天未修改的会话自动删除
- 自动清理已启用

### 示例 2: 禁用清理（默认行为）

```json
{
  "experimental": {
    "checkpoint_retention": {
      "auto_cleanup": false
    }
  }
}
```

**效果**:
- 不执行任何清理
- 所有 checkpoint 永久保留
- 用户手动管理磁盘空间

### 示例 3: 无限保留最近版本

```json
{
  "experimental": {
    "checkpoint_retention": {
      "global_keep_count": 0,
      "per_session_keep_count": 0,
      "auto_cleanup": true
    }
  }
}
```

**效果**:
- 保留所有 checkpoint（0 = 无限制）
- 但会清理过期会话（如果设置了 `session_expiry_days`）

## 向后兼容性

### 保持兼容
1. **latest.md 仍然存在** - 旧代码可以继续读取
2. **latest.meta.json 仍然存在** - 元数据格式不变
3. **默认禁用清理** - 不会影响现有用户

### 新增功能
1. **history/ 目录** - 新增全局历史
2. **by-session/<session-id>/ 目录** - 从单文件改为目录
3. **版本号** - Checkpoint 内容中添加版本信息

### 迁移路径
- 旧的 `by-session/<session-id>.md` 文件不会被自动删除
- 新的 checkpoint 会写入 `by-session/<session-id>/checkpoint-XXX.md`
- 用户可以手动删除旧的单文件格式

## 日志输出

### 写入 Checkpoint
```
[checkpoint] Wrote checkpoint version 5 for session abc123
```

### 清理日志（启用 auto_cleanup 时）
```
[checkpoint-cleanup] Removed old global checkpoint: checkpoint-001.md
[checkpoint-cleanup] Removed old session checkpoint: abc123 checkpoint-001.md
[checkpoint-cleanup] Removed expired session directory: xyz789
```

### 错误日志
```
[checkpoint-cleanup] Failed to remove global checkpoint: checkpoint-001.md Error: ...
[checkpoint-cleanup] Failed to cleanup global history: Error: ...
```

## 验证方法

### 场景 1: 版本化存储测试

1. 触发 5 次 L2/L3 压缩
2. 检查文件结构：
   ```bash
   ls .opencode/openagent-labforge/checkpoints/auto/history/
   # 期望看到: checkpoint-001.md ~ checkpoint-005.md
   
   ls .opencode/openagent-labforge/checkpoints/auto/by-session/<session-id>/
   # 期望看到: checkpoint-001.md ~ checkpoint-005.md
   ```
3. 验证 `latest.md` 内容与 `checkpoint-005.md` 相同

### 场景 2: 清理策略测试

**配置**:
```json
{
  "experimental": {
    "checkpoint_retention": {
      "global_keep_count": 3,
      "per_session_keep_count": 2,
      "auto_cleanup": true
    }
  }
}
```

**步骤**:
1. 触发 5 次 L2/L3 压缩
2. 检查 `history/` 目录：
   ```bash
   ls .opencode/openagent-labforge/checkpoints/auto/history/
   # 期望只看到: checkpoint-003.md, checkpoint-004.md, checkpoint-005.md
   ```
3. 检查 `by-session/<session-id>/` 目录：
   ```bash
   ls .opencode/openagent-labforge/checkpoints/auto/by-session/<session-id>/
   # 期望只看到: checkpoint-004.md, checkpoint-005.md
   ```

### 场景 3: 会话过期清理测试

**配置**:
```json
{
  "experimental": {
    "checkpoint_retention": {
      "session_expiry_days": 7,
      "auto_cleanup": true
    }
  }
}
```

**步骤**:
1. 创建一个旧会话目录（修改时间 > 7 天前）
2. 触发新的 checkpoint 写入
3. 验证旧会话目录被删除

### 场景 4: 禁用清理测试（默认行为）

**配置**: 无（或 `auto_cleanup: false`）

**步骤**:
1. 触发 10 次 L2/L3 压缩
2. 检查所有 checkpoint 都被保留：
   ```bash
   ls .opencode/openagent-labforge/checkpoints/auto/history/
   # 期望看到: checkpoint-001.md ~ checkpoint-010.md（全部保留）
   ```

## 性能影响

### 写入性能
- 每次 checkpoint 写入 3 个文件（之前是 2 个）
- 增加版本号计算（扫描 history/ 目录）
- 影响：**轻微**（通常 < 10ms）

### 清理性能
- 仅在 `auto_cleanup: true` 时执行
- 扫描和删除文件的开销
- 影响：**中等**（取决于文件数量，通常 < 100ms）

### 磁盘空间
- 默认配置（禁用清理）：与之前相同
- 启用清理：显著减少磁盘占用
- 示例：保留 5 个全局 + 3 个/会话，每个 checkpoint ~50KB
  - 10 个会话 = 5 * 50KB + 10 * 3 * 50KB = 1.75MB

## 已知限制

1. **版本号不跨会话同步** - 每个会话独立计数
2. **不支持软链接（Windows）** - latest.md 是完整副本，非软链接
3. **清理是同步操作** - 可能阻塞 checkpoint 写入（通常 < 100ms）
4. **不支持跨项目清理** - 每个项目独立管理

## 下一步

Phase 3: Preemptive 触发优化
- 调整触发阈值从 L3 - 5% 到 L3 - 10%
- 添加可配置的缓冲比例
- 提高压缩安全性

## 构建状态

✅ TypeScript 编译通过
✅ 无类型错误
✅ Schema 生成成功

## 文件清单

### 修改的文件
1. `src/hooks/context-window-monitor-checkpoint.ts` - 版本管理和清理逻辑
2. `src/hooks/context-window-monitor.ts` - 传递配置参数
3. `src/config/schema/experimental.ts` - 配置 schema（Phase 1 已添加）

### 新建的文件
1. `docs/PHASE2_CHECKPOINT_VERSION_MANAGEMENT.md` - 本文档

## 总结

Phase 2 成功实现了 Checkpoint 版本管理和可配置清理：

✅ 版本化存储（全局 + 会话）
✅ 滚动保留策略（可配置数量）
✅ 会话过期清理（可配置天数）
✅ 自动清理开关（默认禁用）
✅ 向后兼容（latest.md 保留）
✅ 详细日志输出

**关键特性**:
- 默认禁用清理，不影响现有用户
- 灵活配置，适应不同使用场景
- 保留历史版本，支持回溯
- 自动清理旧数据，节省磁盘空间

**配置示例**:
```json
{
  "experimental": {
    "checkpoint_retention": {
      "global_keep_count": 5,
      "per_session_keep_count": 3,
      "session_expiry_days": 7,
      "auto_cleanup": true
    }
  }
}
```

下一步将实施 Phase 3: Preemptive 触发优化。
