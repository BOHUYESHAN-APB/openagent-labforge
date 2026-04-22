# 子 Agent 输出处理 - 正确理解

## 重要澄清

经过进一步分析，我们发现需要区分两种不同的委托场景：

### 场景 1: 规划任务（需要优化）✅

**流程：**
```
用户 → prometheus (Task Planner)
     → prometheus 采访、研究
     → prometheus 咨询 metis（gap 分析）
     → prometheus 自己生成计划
     → 写入 .opencode/openagent-labforge/plans/{name}.md
     → prometheus 输出："Plan saved. Run /ol-start-work"
```

**特点：**
- ✅ 计划已经写入文件
- ✅ 用户可以直接读文件
- ✅ Prometheus 不需要重复输出整个计划
- ✅ 只需要简短确认（50-100 tokens）

**Token 消耗：**
- 计划生成：5000 tokens（写入文件）
- Prometheus 确认：50 tokens
- **总消耗：5050 tokens**

### 场景 2: 执行/分析任务（不需要优化）✅

**流程：**
```
用户 → orchestrator (Smart Router)
     → 委托 → oracle 分析架构
     → oracle 返回分析结果（3000 tokens）
     → orchestrator review 并综合
     → orchestrator 输出综合结果（3500 tokens）
```

**特点：**
- ✅ Orchestrator 做了 review 和综合工作
- ✅ 不是简单重复，而是增值
- ✅ 添加了上下文、解释、建议
- ✅ 这是正常的协调工作

**Token 消耗：**
- Oracle 分析：3000 tokens
- Orchestrator 读取：3000 tokens
- Orchestrator 综合输出：3500 tokens
- **总消耗：6500 tokens**（合理！）

## 关键区别

| 维度 | 规划任务 | 执行/分析任务 |
|------|---------|--------------|
| 输出位置 | 文件 (.md) | 内存（返回值） |
| 父 agent 角色 | 确认者 | 协调者/综合者 |
| 是否增值 | 否（只是确认） | 是（review + 综合） |
| 是否重复 | 是（浪费） | 否（增值工作） |
| 需要优化 | ✅ 是 | ❌ 否 |

## 实际的 Token 浪费场景

### 问题场景：Prometheus 重复输出计划

**如果 Prometheus 重复输出整个计划：**
```
1. Prometheus 生成 5000 token 计划 → 写入文件
2. Prometheus 读取文件（不需要，但假设读了）
3. Prometheus 输出整个计划：5000 tokens ← 浪费！

总消耗：10000+ tokens
实际需要：5050 tokens
浪费：~50%
```

**优化后：**
```
1. Prometheus 生成 5000 token 计划 → 写入文件
2. Prometheus 输出简短确认：50 tokens ✓

总消耗：5050 tokens
节省：~50%
```

### 正常场景：Orchestrator 综合分析

**Orchestrator 的工作：**
```
1. Oracle 分析架构：3000 tokens
2. Orchestrator 读取：3000 tokens
3. Orchestrator 综合：
   - 添加上下文
   - 解释关键点
   - 提供建议
   - 连接用户目标
   输出：3500 tokens ✓

总消耗：6500 tokens
这是合理的！Orchestrator 做了增值工作。
```

## 实施建议

### 当前实施（已完成）

1. **修改输出格式** - ✅ 添加 `<subagent_output>` 标签
2. **创建处理能力** - ✅ 区分规划和执行场景
3. **更新 agent prompt** - ✅ 教导正确处理方式

### 实际效果

**对 Prometheus（规划）：**
- ✅ 识别计划已写入文件
- ✅ 只输出简短确认
- ✅ 节省 ~50% tokens

**对 Orchestrator（执行）：**
- ✅ 继续 review 和综合
- ✅ 提供增值输出
- ✅ 不影响正常工作

## 测试场景

### 测试 1: Prometheus 规划

```bash
/plan "设计 RNA-seq 差异表达分析流程"

# 期望：
# 1. Prometheus 生成计划并写入文件
# 2. Prometheus 输出简短确认（< 100 tokens）
# 3. 不重复整个计划内容
```

### 测试 2: Orchestrator 分析

```bash
"分析这个代码库的架构"

# 期望：
# 1. Orchestrator 委托 oracle
# 2. Oracle 返回分析结果
# 3. Orchestrator 综合并输出完整分析（包含建议）
# 4. 输出应该比 oracle 的原始输出更有价值
```

### 测试 3: Bio-Orchestrator 协调

```bash
"执行 RNA-seq 分析，包括 QC、比对、定量"

# 期望：
# 1. Bio-Orchestrator 委托多个专家
# 2. 各专家返回结果
# 3. Bio-Orchestrator 综合所有结果
# 4. 输出应该是综合报告，不是简单拼接
```

## 未来优化

### 可能的改进 1: 智能检测

让 agent 自动检测输出是否已保存到文件：

```typescript
// 如果子 agent 输出包含 "saved to" 或 "written to"
// 自动切换到简短确认模式
if (subagentOutput.includes("saved to") || subagentOutput.includes("written to")) {
  mode = "brief_acknowledgment"
} else {
  mode = "review_and_synthesize"
}
```

### 可能的改进 2: 显式标记

在委托时明确指定处理模式：

```typescript
task(
  subagent_type="bio-planner",
  prompt="...",
  output_mode="file_based"  // 或 "in_memory"
)
```

### 可能的改进 3: Review 功能

如果需要 review 计划文件：

```typescript
// Prometheus 生成计划后
task(
  subagent_type="momus",
  prompt="Review .opencode/openagent-labforge/plans/{name}.md",
  run_in_background=false
)

// Momus 返回 review 结果
// Prometheus 根据 review 更新计划
// 最终输出："Plan reviewed and updated. Run /ol-start-work"
```

## 总结

**核心原则：**
1. **文件输出 = 简短确认**（避免重复）
2. **内存输出 = Review 综合**（增值工作）
3. **区分场景，不要一刀切**

**实际效果：**
- ✅ Prometheus 规划：节省 ~50% tokens
- ✅ Orchestrator 执行：保持正常工作
- ✅ 用户体验：更清晰、更快

**关键理解：**
- Orchestrator 的 review 和综合**不是浪费**，而是**价值所在**
- 只有当输出已经在文件里时，重复才是浪费
- 协调工作需要综合多个来源，这是正常的 token 消耗
