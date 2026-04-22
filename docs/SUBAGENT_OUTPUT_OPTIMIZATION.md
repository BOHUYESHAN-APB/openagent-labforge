# Agent 输出透传优化 - 实施总结

## 问题描述

在主-子 agent 委托模式中，存在严重的 token 浪费问题：

```
用户请求 → 主 Agent (prometheus)
         ↓ 委托
         子 Agent (bio-planner) 生成 5000 tokens 的计划
         ↓ 返回结果
         主 Agent 读取 5000 tokens (消耗 5000 input tokens)
         ↓ 再次输出
         主 Agent 输出 5000 tokens (消耗 5000 output tokens)
         ↓
         用户看到（重复的内容）
         
总消耗：10000 tokens
实际需要：5000 tokens
浪费：50%
```

## 解决方案

### 1. 修改输出格式（src/tools/delegate-task/sync-task.ts）

**改动前：**
```typescript
return `Task completed in ${duration}.
Agent: ${agentToUse}
---
${result.textContent || "(No text output)"}  // 直接输出，会被主 agent 重复
`
```

**改动后：**
```typescript
return `Task completed in ${duration}.
Agent: ${agentToUse}
---
<subagent_output session_id="${sessionID}" agent="${agentToUse}">
${result.textContent || "(No text output)"}
</subagent_output>

<task_metadata>
session_id: ${sessionID}
agent: ${agentToUse}
</task_metadata>`
```

### 2. 创建输出处理能力（src/agents/subagent-output-handling.ts）

新增 `SUBAGENT_OUTPUT_HANDLING_CAPABILITY` 模块，教导主 agent：

**核心原则：**
- ✅ 识别 `<subagent_output>` 标签
- ✅ 不要重复输出子 agent 的内容
- ✅ 只提供简短确认（50-200 tokens）
- ✅ 突出关键点或下一步建议

**示例 - 好的做法：**
```
✓ Plan generated successfully by Bio Planner.

The analysis pipeline includes 5 stages: QC → Alignment → Quantification → DE Analysis → Validation.

Next step: Run `/ol-start-work` to begin execution.
```

**示例 - 坏的做法（浪费）：**
```
The bio-planner has generated the following plan:

[重复整个 5000 token 的计划...]  ← 不要这样做！
```

### 3. 更新主要协调器 Agent

已更新以下 agent 的 prompt，添加 `SUBAGENT_OUTPUT_HANDLING_CAPABILITY`：

- ✅ `orchestrator` (Smart Router / 智能路由器)
- ✅ `bio-orchestrator` (Bio Coordinator / 生信协调器)
- ✅ `engineering-orchestrator` (Eng Coordinator / 工程协调器)

## 预期效果

### Token 消耗对比

**场景：bio-planner 生成 5000 tokens 的计划**

| 项目 | 优化前 | 优化后 | 节省 |
|------|--------|--------|------|
| 子 agent 输出 | 5000 tokens | 5000 tokens | 0 |
| 主 agent 读取 | 5000 tokens | 5000 tokens | 0 |
| 主 agent 输出 | 5000 tokens | 150 tokens | 4850 tokens |
| **总消耗** | **10000 tokens** | **5150 tokens** | **48.5%** |

### 用户体验改进

**优化前：**
- 用户看到重复的内容
- 等待时间更长（主 agent 需要输出大量重复内容）
- 对话历史冗长

**优化后：**
- 用户看到子 agent 的完整输出
- 主 agent 只提供简短确认和指导
- 对话历史更清晰
- 响应速度更快

## 适用场景

这个优化对以下委托场景特别有效：

1. **规划委托**
   - prometheus → bio-planner
   - orchestrator → bio-planner / engineering-planner
   - 计划通常很长（3000-10000 tokens）

2. **文献综合**
   - bio-orchestrator → paper-evidence-synthesizer
   - 文献综合结果通常很长

3. **代码探索**
   - orchestrator → explore
   - 探索结果可能包含大量代码片段

4. **架构分析**
   - engineering-orchestrator → oracle
   - 架构分析报告通常详细

## 不适用场景

以下场景不需要这个优化（输出本来就短）：

- 简单的查询任务（< 500 tokens）
- 错误信息（通常很短）
- 状态确认（几十 tokens）

## 测试建议

### 手动测试

1. **测试规划委托**
   ```bash
   # 使用 orchestrator 创建生信计划
   /plan "设计 RNA-seq 差异表达分析流程"
   
   # 检查：
   # - 是否看到 <subagent_output> 标签
   # - 主 agent 是否只提供简短确认
   # - 是否没有重复输出
   ```

2. **测试生信协调**
   ```bash
   # 使用 bio-orchestrator
   "分析这个 RNA-seq 数据集，包括 QC、比对、定量和差异表达分析"
   
   # 检查：
   # - 各个子 agent 的输出是否被正确标记
   # - 协调器是否避免重复输出
   ```

3. **测试工程协调**
   ```bash
   # 使用 engineering-orchestrator
   "分析这个代码库的架构，包括 API 设计、数据库模式和依赖关系"
   
   # 检查：
   # - oracle 的架构分析是否被正确处理
   # - 协调器是否只提供摘要
   ```

### 自动化测试

建议添加单元测试：

```typescript
// src/tools/delegate-task/sync-task.test.ts
describe("subagent output handling", () => {
  it("should wrap subagent output in tags", async () => {
    const result = await executeSyncTask(...)
    expect(result).toContain("<subagent_output")
    expect(result).toContain("session_id=")
    expect(result).toContain("agent=")
  })
})

// src/agents/orchestrator.test.ts
describe("orchestrator subagent output handling", () => {
  it("should not repeat subagent output", async () => {
    // Mock 子 agent 返回 5000 tokens
    // 验证主 agent 只输出 < 500 tokens
  })
})
```

## 监控指标

建议监控以下指标来验证优化效果：

1. **Token 消耗**
   - 委托任务的平均 token 消耗
   - 主 agent 的输出 token 数量
   - 优化前后对比

2. **响应时间**
   - 委托任务的完成时间
   - 主 agent 的响应时间

3. **用户满意度**
   - 是否有用户反馈内容重复
   - 是否有用户反馈响应太慢

## 未来优化方向

### 1. 流式透传（最优但复杂）

让子 agent 的输出直接流式传给用户，主 agent 完全不参与：

```typescript
// 需要修改 OpenCode 的 session 机制
// 子 session 的输出直接显示在主 session 的 UI 中
```

### 2. 摘要模式

子 agent 输出保存到文件，主 agent 只返回摘要：

```typescript
// 保存到文件
const outputPath = `.opencode/openagent-labforge/subagent-outputs/${sessionID}.md`
await writeFile(outputPath, result.textContent)

// 主 agent 只返回摘要
return `Output saved to: ${outputPath}
Summary: [100-200 token 摘要]`
```

### 3. 智能摘要

使用 LLM 自动生成摘要：

```typescript
// 如果子 agent 输出 > 2000 tokens
// 使用轻量级模型（haiku）生成摘要
const summary = await generateSummary(result.textContent, maxTokens: 200)
```

## 相关文件

- ✅ `src/tools/delegate-task/sync-task.ts` - 输出格式修改
- ✅ `src/agents/subagent-output-handling.ts` - 新增能力模块
- ✅ `src/agents/orchestrator.ts` - 更新 prompt
- ✅ `src/agents/bio-orchestrator.ts` - 更新 prompt
- ✅ `src/agents/engineering-orchestrator.ts` - 更新 prompt

## 总结

这个优化通过简单的标签包装和 prompt 指导，实现了：

- ✅ **48.5% token 节省**（对于长输出场景）
- ✅ **更快的响应速度**
- ✅ **更清晰的对话历史**
- ✅ **向后兼容**（不影响现有功能）
- ✅ **易于实施**（只需修改 3 个文件）

这是一个低成本、高收益的优化，特别适合规划和分析类的委托任务。
