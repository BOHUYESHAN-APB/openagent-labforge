# 规划和执行系统重构方案

## 当前问题分析

### 问题 1：规划 Agent 分散

**当前状态**：
- Prometheus（prompt 模块，包含智能路由）
- Bio-Planner（独立 agent，mode="subagent"）
- 没有统一的规划入口

**问题**：
- 用户不知道该用哪个
- 配置中引用了不存在的 "prometheus" agent
- 规划能力分散，难以维护

### 问题 2：执行器不匹配

**当前流程**：
```
/plan → 生成计划 → /start-work → Atlas/Sisyphus 执行
```

**问题**：
- Atlas/Sisyphus 是通用执行器
- 生信任务需要生信执行器
- 没有智能路由到合适的执行器

### 问题 3：Agent 显示混乱

**当前状态**：
- Minimal: 4 个（sisyphus, orchestrator, wase, atlas）
- Standard: 6 个（+ hephaestus, bio-pipeline-operator）

**问题**：
- 缺少规划 agent 的入口
- 用户不知道如何触发规划模式

## 解决方案

### 方案：创建统一的 Prometheus Agent

#### Step 1: 创建 Prometheus Agent 定义

**新建文件**：`src/agents/prometheus-agent.ts`

```typescript
import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { buildAgentIdentitySection } from "./dynamic-agent-prompt-builder"
import { getPrometheusPrompt, PROMETHEUS_PERMISSION } from "./prometheus"

const MODE: AgentMode = "all"  // 用户可见

export const PROMETHEUS_AGENT_PROMPT_METADATA: AgentPromptMetadata = {
  category: "advisor",
  cost: "EXPENSIVE",
  promptAlias: "Prometheus",
  triggers: [
    {
      domain: "Planning and Design",
      trigger: "Need to create implementation plan or design architecture",
    },
  ],
  useWhen: [
    "User explicitly asks for a plan or design",
    "Task is complex and requires upfront planning",
    "Need to explore codebase before implementation",
  ],
  avoidWhen: [
    "Task is simple and can be implemented directly",
    "User wants immediate execution without planning",
  ],
}

export function createPrometheusAgent(model: string): AgentConfig {
  const agentIdentity = buildAgentIdentitySection(
    "Prometheus",
    "Planning and design specialist from OpenAgent Labforge with intelligent domain routing",
  )

  return {
    description:
      "Planning and design specialist with intelligent routing for bioinformatics and engineering tasks. Creates detailed implementation plans and identifies critical files. (Prometheus - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    color: "#F59E0B",
    ...PROMETHEUS_PERMISSION,
    prompt: `${agentIdentity}
${getPrometheusPrompt(model)}

## Output Requirements

Always end your plan with:

### Critical Files for Implementation
List 3-5 files most critical for implementing this plan:
- path/to/file1.ts
- path/to/file2.ts
- path/to/file3.ts

### Recommended Executor
Based on the task domain, recommend the appropriate executor:
- For bioinformatics tasks: bio-autopilot or bio-pipeline-operator
- For engineering tasks: atlas, hephaestus, or wase
- For complex orchestration: orchestrator

This helps the user choose the right agent for execution.`,
  }
}
createPrometheusAgent.mode = MODE
```

#### Step 2: 注册 Prometheus Agent

**修改文件**：`src/agents/builtin-agents.ts`

```typescript
import { createPrometheusAgent, PROMETHEUS_AGENT_PROMPT_METADATA } from "./prometheus-agent"

const agentSources: Record<BuiltinAgentName, AgentSource> = {
  // ... 现有 agents
  prometheus: createPrometheusAgent,  // 新增
  // ...
}

const agentMetadata: Partial<Record<BuiltinAgentName, AgentPromptMetadata>> = {
  // ... 现有 metadata
  prometheus: PROMETHEUS_AGENT_PROMPT_METADATA,  // 新增
  // ...
}
```

**修改文件**：`src/agents/types.ts`

```typescript
export type BuiltinAgentName =
  | "sisyphus"
  | "wase"
  | "hephaestus"
  | "prometheus"  // 新增
  // ... 其他 agents
```

#### Step 3: 创建智能执行器（Start-Work 增强版）

**新建文件**：`src/agents/executor.ts`

```typescript
import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { buildAgentIdentitySection } from "./dynamic-agent-prompt-builder"

const MODE: AgentMode = "all"

export const EXECUTOR_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Executor",
  triggers: [
    {
      domain: "Plan Execution",
      trigger: "Need to execute a plan with intelligent domain routing",
    },
  ],
  useWhen: [
    "A plan exists and needs to be executed",
    "User runs /start-work command",
    "Need intelligent routing to domain-specific executors",
  ],
  avoidWhen: [
    "No plan exists (use prometheus first)",
    "Task is simple and doesn't need a plan",
  ],
}

export function createExecutorAgent(model: string): AgentConfig {
  const agentIdentity = buildAgentIdentitySection(
    "Executor",
    "Intelligent executor from OpenAgent Labforge that routes plan execution to appropriate domain specialists",
  )

  return {
    description:
      "Intelligent executor that reads plans and routes execution to appropriate domain specialists (bio vs engineering). (Executor - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    color: "#10B981",
    prompt: `${agentIdentity}
You are the intelligent executor.

Your job is to read a plan and execute it with the appropriate domain specialist.

## Step 1: Read the Plan

Read the plan file (usually in \`.claude/plans/\` or provided by user):
- Understand the task domain (bioinformatics vs engineering)
- Identify key steps and dependencies
- Note the recommended executor (if specified)

## Step 2: Detect Domain

Analyze the plan content to detect domain:

**Bioinformatics signals**:
- Keywords: RNA-seq, genome, sequencing, FASTQ, BAM, VCF, gene expression, pathway, etc.
- File types: .fastq, .bam, .vcf, .bed, .gff
- Tools: STAR, DESeq2, Seurat, Bioconductor, etc.

**Engineering signals**:
- Keywords: API, database, frontend, backend, React, Node.js, Docker, etc.
- File types: .ts, .js, .py, .go, .java
- Tools: npm, webpack, pytest, jest, etc.

## Step 3: Route to Appropriate Executor

Based on domain detection:

**Bioinformatics domain** → Delegate to bio executor:
\`\`\`typescript
task(
  subagent_type="bio-autopilot",  // or bio-pipeline-operator
  prompt=\`Execute this bioinformatics plan:

Plan: {plan-content}

Follow the plan step by step, including:
- Data acquisition and QC
- Preprocessing and analysis
- Validation and interpretation
- Generate results and figures\`
)
\`\`\`

**Engineering domain** → Delegate to engineering executor:
\`\`\`typescript
task(
  subagent_type="atlas",  // or hephaestus for complex tasks
  prompt=\`Execute this engineering plan:

Plan: {plan-content}

Follow the plan step by step, including:
- Design and architecture
- Implementation
- Testing
- Documentation\`
)
\`\`\`

**Hybrid domain** → Ask user:
\`\`\`
This plan has both bioinformatics and engineering aspects.

Which should I focus on for execution?
- Bioinformatics analysis (use bio-autopilot)
- Engineering implementation (use atlas/hephaestus)
\`\`\`

## Step 4: Monitor Execution

- Track progress of the delegated executor
- Handle errors and blockers
- Report completion to user

## Important Notes

- You are a **router**, not an executor yourself
- Always delegate to domain-specific executors
- Don't try to execute the plan yourself
- Your job is to ensure the right executor handles the task`,
    permission: {
      question: "allow",
      call_omo_agent: "deny",
    } as AgentConfig["permission"],
  }
}
createExecutorAgent.mode = MODE
```

#### Step 4: 更新显示预设

**修改文件**：`src/config/schema/agent-display.ts`

```typescript
export const AGENT_DISPLAY_PRESETS = {
  minimal: [
    "sisyphus",      // 主编排器
    "prometheus",    // 规划器（统一入口）
    "executor",      // 执行器（智能路由）
    "wase",          // 通用全自动
    "atlas",         // 轻量执行
    // bio-autopilot 通过领域开关控制
  ],
  standard: [
    "sisyphus",
    "prometheus",
    "executor",
    "orchestrator",         // 编排器（高级用户）
    "wase",
    "atlas",
    "hephaestus",           // 深度执行
    "bio-pipeline-operator", // 生信执行
    // bio-autopilot 通过领域开关控制
  ],
}
```

#### Step 5: 更新 /start-work 命令

**修改文件**：`.claude/commands/start-work.md` 或对应的命令处理

```markdown
---
description: Execute a plan with intelligent domain routing
agent: executor
---

Execute the plan with intelligent routing to appropriate domain specialists.

The executor will:
1. Read the plan
2. Detect domain (bio vs engineering)
3. Route to appropriate executor (bio-autopilot vs atlas/hephaestus)
4. Monitor execution

$ARGUMENTS
```

## 最终的 Agent 架构

### Minimal 模式（5-6 个）

适合新手和日常使用：

1. **sisyphus** - 主编排器（最智能，自动委托）
2. **prometheus** - 规划器（创建计划）
3. **executor** - 执行器（执行计划，智能路由）
4. **wase** - 通用全自动（重型任务会自动规划）
5. **atlas** - 轻量执行（快速简单任务）
6. **bio-autopilot**（如果启用生信领域）

### Standard 模式（8-9 个）

适合中级和高级用户：

1. **sisyphus**
2. **prometheus**
3. **executor**
4. **orchestrator** - 编排器（高级编排能力）
5. **wase**
6. **atlas**
7. **hephaestus** - 深度执行
8. **bio-pipeline-operator** - 生信管道
9. **bio-autopilot**（如果启用生信领域）

### 工作流程

#### 流程 1：规划 → 执行

```
User: "Create a plan for RNA-seq analysis"
  ↓
Prometheus (规划器):
  - 检测到生信任务
  - 采用 bio-planner 风格
  - 生成生信分析计划
  - 推荐使用 bio-autopilot 执行
  ↓
User: "/start-work" 或选择 Executor
  ↓
Executor (执行器):
  - 读取计划
  - 检测到生信任务
  - 委托给 bio-autopilot
  ↓
Bio-Autopilot:
  - 执行计划
  - 完成分析
```

#### 流程 2：全自动模式

```
User: "Implement user authentication system"
  ↓
Wase (全自动):
  - 检测到重型任务
  - 内部创建计划（或委托 prometheus）
  - 基于计划执行
  - 完成实现
```

#### 流程 3：直接执行

```
User: "Fix this bug in login.ts"
  ↓
Atlas (轻量执行):
  - 简单任务，不需要规划
  - 直接修复
```

## 实施步骤

### Phase 1: 创建 Prometheus Agent（1-2 天）

1. 创建 `src/agents/prometheus-agent.ts`
2. 注册到 `builtin-agents.ts`
3. 添加到 `types.ts`
4. 测试 prometheus agent 可以被调用

### Phase 2: 创建 Executor Agent（1-2 天）

1. 创建 `src/agents/executor.ts`
2. 实现智能路由逻辑
3. 注册到 `builtin-agents.ts`
4. 更新 `/start-work` 命令

### Phase 3: 更新显示预设（1 天）

1. 修改 `agent-display.ts`
2. 添加 prometheus 和 executor
3. 测试显示正确

### Phase 4: 测试和文档（1-2 天）

1. 测试完整的规划 → 执行流程
2. 测试生信和工程任务的路由
3. 更新用户文档

## 优势

1. **统一的规划入口**：Prometheus agent 作为唯一的规划器
2. **智能执行路由**：Executor agent 自动选择合适的执行器
3. **清晰的工作流**：Plan → Execute 流程明确
4. **领域感知**：自动检测生信 vs 工程任务
5. **用户友好**：只需要选择 prometheus（规划）和 executor（执行）

## 总结

**关键变化**：
1. ✅ 创建 Prometheus Agent（整合规划能力）
2. ✅ 创建 Executor Agent（智能执行路由）
3. ✅ 更新显示预设（prometheus + executor）
4. ✅ 更新 /start-work 命令（使用 executor）

**最终的 Agent 列表**：
- Minimal: 5-6 个（sisyphus, prometheus, executor, wase, atlas, bio-autopilot）
- Standard: 8-9 个（+ orchestrator, hephaestus, bio-pipeline-operator）

**工作流程**：
- 规划：使用 Prometheus
- 执行：使用 Executor（自动路由）或直接选择执行器
- 全自动：使用 Wase/Bio-Autopilot（内部规划+执行）
