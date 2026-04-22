# Agent 暴露分析

## Agent Mode 说明

根据代码中的定义：

```typescript
/**
 * Agent mode determines UI model selection behavior:
 * - "primary": Respects user's UI-selected model (sisyphus, atlas)
 * - "subagent": Uses own fallback chain, ignores UI selection (oracle, explore, etc.)
 * - "all": Available in both contexts (OpenCode compatibility)
 */
export type AgentMode = "primary" | "subagent" | "all";
```

## 所有 Agent 分类表

| Agent 名称 | Mode | Category | 是否应该暴露 | 原因 |
|-----------|------|----------|------------|------|
| **主要执行 Agents** |
| sisyphus | all | - | ✅ 是 | 主编排器，用户直接交互 |
| wase | all | - | ✅ 是 | 通用全自动，用户直接交互 |
| atlas | all | - | ✅ 是 | 轻量执行，用户直接交互 |
| hephaestus | all | - | ✅ 是 | 深度执行，用户直接交互 |
| bio-autopilot | all | - | ✅ 是 | 生信自动驾驶，用户直接交互 |
| bio-pipeline-operator | all | - | ✅ 是 | 生信管道执行，用户直接交互 |
| **规划和编排 Agents** |
| orchestrator | all | specialist | ✅ 是 | 通用编排器，用户可以直接调用 |
| bio-orchestrator | subagent | specialist | ❌ 否 | 由 orchestrator 内部调用 |
| engineering-orchestrator | subagent | specialist | ❌ 否 | 由 orchestrator 内部调用 |
| bio-planner | subagent | advisor | ❌ 否 | 由其他 agent 调用做规划 |
| **专业调查工具** |
| oracle | subagent | specialist | ❌ 否 | 架构咨询，由主 agent 委托 |
| librarian | subagent | exploration | ❌ 否 | 文档查询，由主 agent 委托 |
| explore | subagent | exploration | ❌ 否 | 代码探索，由主 agent 委托 |
| metis | subagent | advisor | ❌ 否 | 元知识，由主 agent 委托 |
| momus | subagent | specialist | ❌ 否 | 代码审查，由主 agent 委托 |
| github-scout | subagent | exploration | ❌ 否 | GitHub 搜索，由主 agent 委托 |
| tech-scout | subagent | exploration | ❌ 否 | 技术侦察，由主 agent 委托 |
| **生信专家** |
| bio-methodologist | subagent | specialist | ❌ 否 | 生信方法学，由主 agent 委托 |
| wet-lab-designer | subagent | specialist | ❌ 否 | 湿实验设计，由主 agent 委托 |
| paper-evidence-synthesizer | subagent | specialist | ❌ 否 | 文献证据综合，由主 agent 委托 |
| multimodal-looker | subagent | utility | ❌ 否 | 多模态分析，由主 agent 委托 |
| **写作工具** |
| acceptance-reviewer | subagent | specialist | ❌ 否 | 验收审查，由主 agent 委托 |
| article-writer | subagent | specialist | ❌ 否 | 文章写作，由主 agent 委托 |
| scientific-writer | subagent | specialist | ❌ 否 | 科学写作，由主 agent 委托 |
| **Swarm Agents** |
| swarm-coordinator | subagent | specialist | ❌ 否 | 蜂群协调器，由 orchestrator 启动 |
| swarm-worker | subagent | specialist | ❌ 否 | 蜂群工作者，由 coordinator 启动 |
| swarm-specialist | subagent | specialist | ❌ 否 | 蜂群专家，由 coordinator 启动 |
| **其他** |
| sisyphus-junior | subagent | - | ❌ 否 | Sisyphus 的子 agent |

## 设计原则

### 应该暴露的 Agent（mode = "all"）

**特征**：
- 用户可以直接选择和交互
- 有完整的用户交互能力（可以问问题）
- 是"执行型" agent，自己完成任务
- 代表不同的工作模式或自动化程度

**当前应该暴露的 7 个**：
1. `sisyphus` - 主编排器（最智能，会委托专家）
2. `wase` - 通用全自动（自动化程度高）
3. `atlas` - 轻量执行（快速简单任务）
4. `hephaestus` - 深度执行（复杂任务）
5. `orchestrator` - 通用编排器（用户明确需要编排时）
6. `bio-autopilot` - 生信自动驾驶（生信领域）
7. `bio-pipeline-operator` - 生信管道执行（生信领域）

### 不应该暴露的 Agent（mode = "subagent"）

**特征**：
- 由其他 agent 委托调用
- 专注于特定子任务
- 没有完整的用户交互能力
- 是"工具型" agent，不是"执行型"

**为什么不暴露**：
1. **降低认知负担**：用户不需要知道内部实现细节
2. **避免误用**：这些 agent 设计为被委托，不适合直接使用
3. **保持简洁**：只暴露用户真正需要选择的 agent
4. **智能路由**：主 agent 会自动选择合适的子 agent

## 当前配置问题

### 问题 1：orchestrator 的 mode

```typescript
// src/agents/orchestrator.ts
const MODE: AgentMode = "all"  // ✅ 正确
```

**分析**：
- Orchestrator 应该暴露给用户
- 用户可能明确需要"编排多个任务"的能力
- 它有完整的用户交互能力（可以问问题）

### 问题 2：bio-orchestrator 和 engineering-orchestrator 的 mode

```typescript
// src/agents/bio-orchestrator.ts
const MODE: AgentMode = "subagent"  // ✅ 正确

// src/agents/engineering-orchestrator.ts
const MODE: AgentMode = "subagent"  // ✅ 正确
```

**分析**：
- 这两个是 orchestrator 的内部实现
- 通过 `PROMETHEUS_INTELLIGENT_ROUTING` 自动选择
- 用户不需要直接看到它们

### 问题 3：当前的显示预设

```typescript
// src/config/schema/agent-display.ts
export const AGENT_DISPLAY_PRESETS = {
  minimal: [
    "sisyphus",
    "prometheus",      // ❓ 问题：prometheus 不在 builtin-agents 中
    "orchestrator",
    "wase",
    "atlas",
  ],
  standard: [
    "sisyphus",
    "prometheus",      // ❓ 问题：prometheus 不在 builtin-agents 中
    "orchestrator",
    "wase",
    "atlas",
    "hephaestus",
    "bio-pipeline-operator",
  ],
}
```

**发现的问题**：
- `prometheus` 在预设中，但没有在 `builtin-agents.ts` 中注册
- 这可能是为什么用户看不到 prometheus 的原因

## 推荐的显示预设

### Minimal 模式（5-6 个）

**目标**：最简洁，适合新手

```typescript
minimal: [
  "sisyphus",        // 主编排器（最智能）
  "wase",            // 通用全自动
  "atlas",           // 轻量执行
  "orchestrator",    // 编排器（用户明确需要时）
  // bio-autopilot 通过领域开关控制
]
```

**去掉的**：
- `prometheus` - 不在 builtin-agents 中，可能是遗留配置
- `hephaestus` - 移到 standard

### Standard 模式（7-8 个）

**目标**：平衡简洁和控制

```typescript
standard: [
  "sisyphus",
  "wase",
  "atlas",
  "hephaestus",              // 深度执行
  "orchestrator",
  "bio-pipeline-operator",   // 生信管道
  // bio-autopilot 通过领域开关控制
]
```

### Full 模式（仅用于调试）

**目标**：显示所有 mode="all" 的 agent

```typescript
full: [
  // 所有 mode="all" 的 agent
  "sisyphus",
  "wase",
  "atlas",
  "hephaestus",
  "orchestrator",
  "bio-autopilot",
  "bio-pipeline-operator",
]
```

**不包括**：
- 所有 mode="subagent" 的 agent
- 这些由主 agent 自动委托

## 需要检查的问题

### 1. Prometheus 在哪里？

```bash
# 搜索 prometheus agent 定义
grep -rn "createPrometheusAgent\|prometheus.*Agent" src/agents/
```

**可能的情况**：
- Prometheus 可能是 OpenCode 上游的 agent
- 或者是计划中但未实现的 agent
- 需要确认是否应该从预设中移除

### 2. 是否需要暴露 bio-orchestrator 和 engineering-orchestrator？

**当前设计**：
- 它们是 `subagent` mode
- 由 orchestrator 通过智能路由内部调用

**问题**：
- 用户是否需要直接选择"生信编排"或"工程编排"？
- 还是让 orchestrator 自动检测更好？

**建议**：
- 保持当前设计（不暴露）
- 让 orchestrator 自动路由
- 如果用户明确需要，可以在配置中启用

## 总结

**应该暴露的 Agent（7 个）**：
1. sisyphus
2. wase
3. atlas
4. hephaestus
5. orchestrator
6. bio-autopilot（生信领域）
7. bio-pipeline-operator（生信领域）

**不应该暴露的 Agent（所有 mode="subagent" 的）**：
- 所有专业调查工具（oracle, librarian, explore, metis, momus, github-scout, tech-scout）
- 所有生信专家（bio-methodologist, wet-lab-designer, paper-evidence-synthesizer, multimodal-looker）
- 所有写作工具（acceptance-reviewer, article-writer, scientific-writer）
- 所有内部编排器（bio-orchestrator, engineering-orchestrator, bio-planner）
- 所有 Swarm agents（swarm-coordinator, swarm-worker, swarm-specialist）

**设计原则**：
- 只暴露"执行型" agent（mode="all"）
- 隐藏"工具型" agent（mode="subagent"）
- 让主 agent 自动委托专家
- 保持用户界面简洁
