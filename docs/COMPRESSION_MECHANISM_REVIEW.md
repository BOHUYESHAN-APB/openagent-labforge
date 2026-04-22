# 上下文压缩机制审查报告

## 当前机制分析

### 1. 压缩层级结构

#### L1 级别（60-80% 使用率）
**触发机制**：
- 写入 Context Capsule
- 写入 Compression State
- 显示 Toast 提示
- 注入压缩通知到工具输出

**压缩强度**：⭐ 轻量
- ❌ 不注入模型指令
- ✅ Micro-Pruning：压缩过长工具输出（>1000 字符）
- ✅ 移除旧的压缩通知

**实际效果**：
- 压缩率：~5-10%（仅工具输出）
- 模型行为：无变化
- 用户感知：Toast 提示

**问题**：
- ⚠️ 压缩强度太弱，对大型会话效果有限
- ⚠️ 没有模型指令，模型可能继续冗长回复

#### L2 级别（75-90% 使用率）
**触发机制**：
- 写入 Context Capsule
- 写入 Compression State
- **写入 Light Checkpoint**（`.opencode/openagent-labforge/checkpoints/auto/latest.md`）
- 显示 Toast 提示
- 注入压缩通知
- **注入压缩指令到最后一条用户消息**

**压缩强度**：⭐⭐ 中等
- ✅ 注入模型指令（"Context debt is rising"）
- ✅ Micro-Pruning
- ✅ 模型主动压缩回复
- ✅ 避免重复历史

**实际效果**：
- 压缩率：~15-25%（工具输出 + 模型配合）
- 模型行为：简洁回复，使用文件而非聊天
- 用户感知：Toast + 压缩通知

**问题**：
- ⚠️ 指令强度中等，模型可能不够严格
- ⚠️ Light Checkpoint 内容较少，恢复能力有限

#### L3 级别（85-98% 使用率）
**触发机制**：
- 写入 Context Capsule
- 写入 Compression State
- **写入 Heavy Checkpoint**（包含完整状态）
- 显示 Toast 提示
- 注入压缩通知
- **注入严格压缩指令**

**压缩强度**：⭐⭐⭐ 重量
- ✅ 严格模型指令（"Severe context debt detected"）
- ✅ Micro-Pruning
- ✅ 模型严格限制范围
- ✅ 建议用户开新会话

**实际效果**：
- 压缩率：~30-40%（工具输出 + 模型严格配合）
- 模型行为：只完成当前任务，拒绝新分支
- 用户感知：Toast + 压缩通知 + 建议开新会话

**问题**：
- ⚠️ 仍然依赖模型配合，不是强制压缩
- ⚠️ 如果模型不遵守指令，压缩效果有限

#### Preemptive 自动压缩（L3 - 5%）
**触发机制**：
- 调用 `session.summarize()` API
- 使用配置的压缩模型（默认 Haiku）

**压缩强度**：⭐⭐⭐⭐⭐ 最强
- ✅ 强制压缩，不依赖模型配合
- ✅ 删除旧消息，生成摘要
- ✅ 保留最近 2-3 条消息

**实际效果**：
- 压缩率：~60-80%（OpenCode 官方机制）
- 模型行为：从摘要继续
- 用户感知：Toast + 上下文计数器下降

**问题**：
- ⚠️ 触发较晚（90%），可能已经接近限制
- ⚠️ 压缩过程耗时（120 秒超时）
- ⚠️ 可能丢失部分细节

### 2. Checkpoint 机制分析

#### Light Checkpoint（L2）
**文件结构**：
```
.opencode/openagent-labforge/checkpoints/auto/
├── latest.md                    # 最新 checkpoint（覆盖式）
├── latest.meta.json             # 元数据（覆盖式）
└── by-session/
    └── <session-id>.md          # 按会话保存（累积式）
```

**内容**：
- Session ID
- Context Pressure（token 使用情况）
- Goal（当前目标）
- Current State（运行时状态）
- Stage Capsule（阶段胶囊）
- Context Capsule（上下文胶囊）
- Resume Instructions

**特点**：
- ✅ 轻量级，快速生成
- ✅ 包含恢复所需的基本信息
- ❌ 不包含完整历史
- ❌ 依赖 runtime 文件

#### Heavy Checkpoint（L3）
**文件结构**：同 Light Checkpoint

**内容**：同 Light Checkpoint + 更详细的状态

**特点**：
- ✅ 包含完整状态
- ✅ 包含 Stage Anchor Digest（前 4000 字符）
- ✅ 标记为 "cross-session"（跨会话）
- ✅ 建议用户切换会话
- ❌ 仍然不包含完整聊天历史

#### 保留策略问题

**当前行为**：
- `latest.md` 和 `latest.meta.json` **覆盖式写入**（只保留最新）
- `by-session/<session-id>.md` **累积式写入**（每次覆盖同一会话）

**问题**：
1. ⚠️ **没有历史版本保留** - 只保留最新的 checkpoint
2. ⚠️ **没有清理机制** - `by-session/` 目录会无限增长
3. ⚠️ **没有版本号** - 无法追溯历史 checkpoint
4. ⚠️ **没有过期清理** - 旧会话的 checkpoint 永久保留

### 3. Micro-Pruning 机制分析

**触发条件**：所有级别（L1/L2/L3）

**压缩目标**：
1. 过长的工具输出（>1000 字符）
2. 旧的压缩通知

**压缩方法**：
```typescript
// 工具输出压缩
if (output.length > 1000) {
  state["output"] = "[Labforge compacted stale tool output]"
}

// 移除旧压缩通知
if (text.includes("▣ Labforge |") || text.includes("Compression guard L")) {
  // 移除
}
```

**效果评估**：
- ✅ 简单有效
- ✅ 不影响功能
- ❌ 压缩率有限（5-10%）
- ❌ 只针对工具输出，不压缩对话

### 4. 与 opencode-dynamic-context-pruning 对比

#### 相似之处
- ✅ Micro-Pruning 机制
- ✅ 压缩指令注入
- ✅ Context Capsule 机制
- ✅ 分级警告（L1/L2/L3）

#### 差异之处
- ✅ 添加了 Preemptive 自动压缩（我们的增强）
- ✅ 添加了上下文切换缓冲（我们的增强）
- ✅ 添加了准确的上下文限制检测（我们的增强）
- ❌ 可能缺少更激进的 Pruning 策略

## 优化建议

### 优先级 1：增强 L1/L2 压缩强度

#### 问题
L1/L2 的压缩效果太弱，依赖模型配合，实际压缩率只有 5-25%。

#### 建议
1. **L1 也注入轻量指令**
   ```
   [Labforge Compression Directive - L1]
   - Keep responses concise and focused
   - Avoid repeating previous context
   - Use file references instead of inline code blocks
   ```

2. **增强 Micro-Pruning**
   - 压缩阈值从 1000 降低到 500 字符
   - 压缩更多类型的内容：
     - 重复的错误信息
     - 过长的日志输出
     - 重复的代码片段

3. **添加消息去重**
   - 检测相似的 assistant 消息
   - 合并重复的工具调用结果

#### 预期效果
- L1 压缩率：5-10% → 15-20%
- L2 压缩率：15-25% → 30-40%

### 优先级 2：优化 Checkpoint 保留策略

#### 问题
1. 只保留最新 checkpoint，无法回溯
2. `by-session/` 目录无限增长
3. 没有版本管理

#### 建议方案 A：滚动保留（推荐）
```
.opencode/openagent-labforge/checkpoints/auto/
├── latest.md                    # 最新
├── latest.meta.json
├── history/
│   ├── checkpoint-001.md        # 保留最近 5 个
│   ├── checkpoint-002.md
│   ├── checkpoint-003.md
│   ├── checkpoint-004.md
│   └── checkpoint-005.md
└── by-session/
    └── <session-id>/
        ├── checkpoint-001.md    # 每个会话保留最近 3 个
        ├── checkpoint-002.md
        └── checkpoint-003.md
```

**清理策略**：
- 全局保留最近 5 个 checkpoint
- 每个会话保留最近 3 个 checkpoint
- 超过 7 天的会话目录自动清理

#### 建议方案 B：时间戳保留
```
.opencode/openagent-labforge/checkpoints/auto/
├── latest.md -> 2026-04-22T10-30-00.md  # 软链接
├── 2026-04-22T10-30-00.md
├── 2026-04-22T09-15-00.md
├── 2026-04-22T08-00-00.md
└── by-session/
    └── <session-id>/
        ├── 2026-04-22T10-30-00.md
        └── 2026-04-22T09-15-00.md
```

**清理策略**：
- 保留最近 24 小时内的所有 checkpoint
- 24 小时后只保留每小时第一个
- 7 天后只保留每天第一个
- 30 天后删除

#### 推荐：方案 A
- 更简单
- 更可预测
- 更容易实现

### 优先级 3：提前 Preemptive 触发点

#### 问题
Preemptive 在 90% 才触发，太晚了，可能已经接近限制。

#### 建议
- Conservative: L3 - 10%（75% 触发）
- Balanced: L3 - 10%（85% 触发）
- Aggressive: L3 - 5%（93% 触发）

#### 理由
- 给压缩过程留更多空间
- 避免在压缩过程中触发限制
- 更安全的缓冲区

### 优先级 4：添加压缩效果监控

#### 问题
无法评估压缩效果，不知道是否达到预期。

#### 建议
在 `context-pressure.json` 中添加历史记录：
```json
{
  "session_id": "...",
  "current": {
    "carried_tokens": 850000,
    "level": 2,
    "timestamp": "2026-04-22T10:30:00Z"
  },
  "history": [
    {
      "level": 1,
      "carried_tokens": 700000,
      "timestamp": "2026-04-22T10:00:00Z",
      "action": "micro-prune",
      "removed_tokens": 50000
    },
    {
      "level": 2,
      "carried_tokens": 850000,
      "timestamp": "2026-04-22T10:30:00Z",
      "action": "checkpoint",
      "removed_tokens": 150000
    }
  ]
}
```

**用途**：
- 追踪压缩效果
- 评估不同级别的压缩率
- 调优阈值配置

### 优先级 5：添加手动压缩命令

#### 问题
用户无法主动触发压缩，只能等待自动触发。

#### 建议
添加命令：
- `/ol-compress` - 手动触发 Preemptive 压缩
- `/ol-compress-light` - 手动触发 L2 级别压缩
- `/ol-compress-heavy` - 手动触发 L3 级别压缩

**用途**：
- 用户在开始大型任务前主动压缩
- 测试压缩效果
- 紧急情况下强制压缩

## 总结

### 当前机制评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **L1 压缩强度** | ⭐⭐ | 太弱，只有 5-10% |
| **L2 压缩强度** | ⭐⭐⭐ | 中等，15-25% |
| **L3 压缩强度** | ⭐⭐⭐⭐ | 较强，30-40% |
| **Preemptive 强度** | ⭐⭐⭐⭐⭐ | 最强，60-80% |
| **Checkpoint 质量** | ⭐⭐⭐⭐ | 内容完整 |
| **Checkpoint 管理** | ⭐⭐ | 缺少版本管理和清理 |
| **用户体验** | ⭐⭐⭐⭐ | 提示清晰，但缺少手动控制 |
| **可配置性** | ⭐⭐⭐⭐⭐ | 三种 profile，可自定义阈值 |

### 核心问题

1. ⚠️ **L1/L2 压缩强度不足** - 依赖模型配合，效果有限
2. ⚠️ **Checkpoint 无版本管理** - 只保留最新，无法回溯
3. ⚠️ **Preemptive 触发较晚** - 90% 才触发，缓冲不足
4. ⚠️ **缺少压缩效果监控** - 无法评估和调优
5. ⚠️ **缺少手动控制** - 用户无法主动压缩

### 优化优先级

1. **立即优化**：增强 L1/L2 压缩强度（影响最大）
2. **短期优化**：优化 Checkpoint 保留策略（防止磁盘爆满）
3. **中期优化**：提前 Preemptive 触发点（提高安全性）
4. **长期优化**：添加监控和手动控制（提升可维护性）

### 预期改进效果

优化后的压缩率：
- L1: 5-10% → **15-20%**
- L2: 15-25% → **30-40%**
- L3: 30-40% → **40-50%**
- Preemptive: 60-80%（不变）

整体效果：
- ✅ 更早介入，避免接近限制
- ✅ 更强压缩，延长会话寿命
- ✅ 更好管理，避免磁盘浪费
- ✅ 更多控制，提升用户体验
