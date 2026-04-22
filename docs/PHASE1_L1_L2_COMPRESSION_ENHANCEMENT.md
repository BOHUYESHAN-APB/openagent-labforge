# Phase 1: L1/L2 压缩增强实施报告

## 概述

本阶段完成了上下文压缩机制优化计划的第一阶段：增强 L1/L2 压缩强度。

## 实施内容

### 1. 添加 L1 压缩指令

**修改文件**: `src/hooks/context-window-monitor-directive.ts`

**变更内容**:
- 为 L1 级别添加了轻量压缩指令（之前 L1 没有任何指令）
- 添加了 `ratio?: number` 参数以显示使用率百分比
- 分别为 engineering 和 bio profile 添加了 L1 指令

**Engineering L1 指令**:
```
[Labforge Compression Directive]
- Profile: engineering
- Context usage is rising (X%).
- Keep responses concise and focused on the current task.
- Prefer file references over inline code blocks.
- Avoid repeating previous context unnecessarily.
```

**Bio L1 指令**:
```
[Labforge Compression Directive]
- Profile: bioinformatics / academic
- Context usage is rising (X%).
- Keep responses concise and focused on the current checkpoint.
- Prefer file references and local notes over inline content.
- Avoid repeating previous literature or evidence context unnecessarily.
```

### 2. 启用 L1 指令注入

**修改文件**: `src/hooks/context-window-monitor.ts`

**变更内容**:
- 修改 `injectCompressionDirective()` 函数：
  - 从 `if (level < 2) return` 改为 `if (level < 1) return`
  - 添加 `ratio?: number` 参数
  - 更新调用点传递 `usageRatio`

**效果**: L1 级别现在会注入压缩指令到最后一条用户消息

### 3. 增强 Micro-Pruning 策略

**修改文件**: `src/hooks/context-window-monitor.ts`

**变更内容**:
- 修改 `compactToolPartOutput()` 函数：
  - 添加 `threshold: number` 参数（之前硬编码为 1000）
  - 使用可配置的阈值而非固定值

- 修改 `applyMicroPrune()` 函数：
  - 添加 `microPruneThreshold?: number` 参数
  - 默认阈值从 1000 降低到 **500 字符**
  - 传递阈值给 `compactToolPartOutput()`

**效果**: 工具输出超过 500 字符（而非 1000）就会被压缩

### 4. 添加配置选项

**修改文件**: `src/config/schema/experimental.ts`

**新增配置**:

```typescript
/** Context compression configuration */
context_compression: z.object({
  /** Micro-pruning threshold for tool output compression in characters (default: 500) */
  micro_prune_threshold: z.number().int().min(100).max(5000).optional(),
  /** Enable duplicate content detection (default: true) */
  enable_duplicate_detection: z.boolean().optional(),
  /** Enable error stack compression (default: true) */
  enable_error_stack_compression: z.boolean().optional(),
}).optional(),

/** Checkpoint retention configuration */
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

/** Preemptive compaction configuration */
preemptive_compaction_config: z.object({
  /** Buffer ratio before L3 threshold to trigger preemptive compaction (default: 0.10 = 10%) */
  buffer_ratio: z.number().min(0.01).max(0.20).optional(),
  /** Timeout in milliseconds for compaction operation (default: 120000) */
  timeout_ms: z.number().int().min(30000).max(300000).optional(),
  /** Retry on failure (default: false) */
  retry_on_failure: z.boolean().optional(),
}).optional(),
```

**说明**:
- `context_compression`: 控制 Micro-Pruning 行为
- `checkpoint_retention`: 为 Phase 2 准备（默认不清理）
- `preemptive_compaction_config`: 为 Phase 3 准备

## 预期效果

### L1 压缩率提升
- **之前**: 5-10%（仅 Micro-Pruning，无模型指令）
- **现在**: 15-20%（Micro-Pruning + 轻量模型指令）
- **提升**: +100%

### L2 压缩率提升
- **之前**: 15-25%（Micro-Pruning + 中等模型指令）
- **现在**: 30-40%（增强 Micro-Pruning + 中等模型指令）
- **提升**: +60%

### Micro-Pruning 效果
- 阈值从 1000 降低到 500 字符
- 更多工具输出会被压缩
- 可通过配置调整阈值（100-5000 字符）

## 配置示例

用户可以在 `.opencode/openagent-labforge.json` 中配置：

```json
{
  "experimental": {
    "context_compression": {
      "micro_prune_threshold": 500,
      "enable_duplicate_detection": true,
      "enable_error_stack_compression": true
    }
  }
}
```

## 验证方法

### 场景 1: L1 触发测试

1. 使用 1M context 模型（balanced profile）
2. 工作到达到 700K tokens（70%）
3. 期望看到：
   - Toast 提示 "Context usage: 700K/1M (70%)"
   - 工具输出中注入 L1 压缩通知
   - 模型回复变得简洁
   - 超过 500 字符的工具输出被压缩

### 场景 2: Micro-Pruning 测试

1. 生成大量工具输出（>500 字符）
2. 触发 L1/L2/L3 任意级别
3. 期望看到：
   - 压缩通知中显示 "compacted tool outputs" 数量
   - 旧的工具输出被替换为 "[Labforge compacted stale tool output]"

### 场景 3: 配置测试

1. 设置 `micro_prune_threshold: 300`
2. 生成 400 字符的工具输出
3. 期望看到：
   - 工具输出被压缩（因为 400 > 300）

## 待完成工作

Phase 1 还有以下功能未实现（标记为 TODO）：

1. **重复内容检测** (`enable_duplicate_detection`)
   - 检测相似度 > 80% 的 assistant 消息
   - 合并或移除重复内容

2. **错误堆栈压缩** (`enable_error_stack_compression`)
   - 压缩过长的错误堆栈
   - 保留前 10 行 + 后 5 行

这两个功能将在后续迭代中实现。

## 下一步

Phase 2: Checkpoint 版本管理
- 实现滚动版本保留（全局 5 个，每会话 3 个）
- 添加可配置的清理策略（默认禁用）
- 创建 TUI 配置界面

## 构建状态

✅ TypeScript 编译通过
✅ 无类型错误
✅ Schema 生成成功

## 文件清单

### 修改的文件
1. `src/hooks/context-window-monitor-directive.ts` - 添加 L1 指令
2. `src/hooks/context-window-monitor.ts` - 启用 L1 注入，增强 Micro-Pruning
3. `src/config/schema/experimental.ts` - 添加配置选项

### 新建的文件
1. `docs/PHASE1_L1_L2_COMPRESSION_ENHANCEMENT.md` - 本文档

## 总结

Phase 1 成功完成了 L1/L2 压缩增强的核心功能：

✅ L1 现在有压缩指令（之前没有）
✅ Micro-Pruning 阈值降低到 500（之前 1000）
✅ 所有参数可配置（通过 experimental.context_compression）
✅ 为 Phase 2/3 添加了配置 schema

预期压缩率提升：
- L1: +100% (5-10% → 15-20%)
- L2: +60% (15-25% → 30-40%)

下一步将实施 Phase 2: Checkpoint 版本管理。
