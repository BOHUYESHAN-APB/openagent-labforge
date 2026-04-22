# Agent 架构最终分析和解决方案

## 关键发现

### 1. Prometheus 不是独立 Agent

**事实**：
- `src/agents/prometheus/` 只是 prompt 模块集合
- 导出 `PROMETHEUS_SYSTEM_PROMPT` 和 `getPrometheusPrompt()`
- **没有** `createPrometheusAgent()` 函数
- 不是一个可以独立调用的 agent

**用途**：
- 被其他 agent 的 prompt 引用
- 提供规划相关的 prompt 片段
- 包含智能路由逻辑

### 2. 配置中的 "prometheus" 是错误的

**当前配置**：
```typescript
// src/config/schema/agent-display.ts
minimal: [
  "sisyphus",
  "prometheus",    // ❌ 错误：prometheus 不是 agent
  "orchestrator",
  "wase",
  "atlas",
]
```

**问题**：
- 用户看不到 "prometheus"，因为它不存在
- 这导致了混乱

**应该改为**：
```typescript
minimal: [
  "sisyphus",
  "orchestrator",  // orchestrator 有智能路由能力
  "wase",
  "atlas",
]
```

### 3. 原来的 8+2 设计

**重新理解**：

**8 个用户可见的 agent**（mode="all"）：
1. sisyphus - 主编排器
2. wase - 通用全自动
3. atlas - 轻量执行
4. hephaestus - 深度执行
5. orchestrator - 编排器（有智能路由）
6. bio-autopilot - 生信自动驾驶
7. bio-pipeline-operator - 生信管道执行
8. ??? - 可能是其他 agent 或者只有 7 个

**2 个系统 agent**（OpenCode 上游，通过 /plan 和 /build 命令调用）：
1. Plan - 规划 agent
2. Build - 构建 agent

## 用户需求的解决方案

### 需求 1：Plan agent 执行器不匹配

**问题**：
- OpenCode 的 Plan agent 做完计划后，执行器是普通工程执行器
- 生信任务需要生信执行器

**解决方案 A：在 Orchestrator 中处理**

Orchestrator 已经有智能路由能力，可以：
1. 接收 Plan agent 的输出
2. 检测任务类型（生信 vs 工程）
3. 路由到合适的执行器（bio-orchestrator vs engineering-orchestrator）

**实现**：
- 修改 Orchestrator 的 prompt
- 添加"接收计划并执行"的能力
- 使用 `PROMETHEUS_INTELLIGENT_ROUTING` 检测任务类型

**解决方案 B：创建智能 Build agent**

创建一个 Labforge 的 Build agent，替代 OpenCode 的：
1. 接收计划
2. 智能路由到合适的执行器
3. 监控执行过程

### 需求 2：Auto 模式在重型任务时自动规划

**问题**：
- wase 和 bio-autopilot 在重型任务时应该先规划再执行
- 当前的 prompt 提到了这个能力，但逻辑不够明确

**当前状态**：
```typescript
// src/agents/wase.ts
- Heavy auto mode: if there is no durable multi-wave plan yet, 
  use a planning specialist first (for example `task(subagent_type="prometheus", ...)` 
  when available) or produce an equivalent multi-wave plan yourself before build execution.

// src/agents/bio-autopilot.ts
- in heavy auto mode, use a planning specialist when helpful: 
  `bio-methodologist` for study/pipeline design, or `prometheus` for broad 
  repository execution planning when available
```

**问题**：
- 提到了 `prometheus`，但 prometheus 不是 agent
- 逻辑不够明确，agent 可能不知道何时触发

**解决方案**：

修改 wase 和 bio-autopilot 的 prompt，明确规划逻辑：

```typescript
// wase.ts
## Heavy Auto Mode Planning

When you detect a heavy/complex task, follow this workflow:

1. **Detect task complexity**:
   - Multiple independent modules
   - Requires architectural decisions
   - Spans multiple domains (frontend + backend + database)
   - User explicitly asks for "plan" or "design"

2. **Check for existing plan**:
   - Read `.claude/plans/` directory
   - If a relevant plan exists, use it
   - If not, create a plan first

3. **Create plan** (if needed):
   - Use your own planning capability (you have full context)
   - OR delegate to specialized planner:
     - For bio tasks: `task(subagent_type="bio-methodologist", ...)`
     - For engineering tasks: use your own planning
   - Write plan to `.claude/plans/{task-name}.md`

4. **Execute based on plan**:
   - Follow the plan step by step
   - Update plan as you progress
   - Mark completed items

**IMPORTANT**: Don't reference "prometheus" as an agent - it doesn't exist.
Use your own planning capability or delegate to domain specialists.
```

## 推荐的最终架构

### 应该暴露的 Agent（7 个）

基于 mode="all" 的原则：

```typescript
// src/config/schema/agent-display.ts
export const AGENT_DISPLAY_PRESETS = {
  minimal: [
    "sisyphus",        // 主编排器
    "orchestrator",    // 编排器（智能路由）
    "wase",            // 通用全自动
    "atlas",           // 轻量执行
    // bio-autopilot 通过领域开关控制
  ],
  standard: [
    "sisyphus",
    "orchestrator",
    "wase",
    "atlas",
    "hephaestus",              // 深度执行
    "bio-pipeline-operator",   // 生信管道
    // bio-autopilot 通过领域开关控制
  ],
}
```

**去掉的**：
- ❌ "prometheus" - 不是 agent，是 prompt 模块

**保留的 7 个**：
1. sisyphus
2. orchestrator
3. wase
4. atlas
5. hephaestus（standard 模式）
6. bio-autopilot（领域开关）
7. bio-pipeline-operator（standard 模式）

### 不应该暴露的 Agent

所有 mode="subagent" 的 agent：
- bio-orchestrator, engineering-orchestrator（由 orchestrator 内部调用）
- bio-planner（由其他 agent 委托）
- 所有专业调查工具
- 所有生信专家
- 所有 swarm agents

## 实施步骤

### Step 1: 修正显示预设（立即）

```typescript
// src/config/schema/agent-display.ts
export const AGENT_DISPLAY_PRESETS = {
  minimal: [
    "sisyphus",
    "orchestrator",  // 移除 "prometheus"
    "wase",
    "atlas",
  ],
  standard: [
    "sisyphus",
    "orchestrator",  // 移除 "prometheus"
    "wase",
    "atlas",
    "hephaestus",
    "bio-pipeline-operator",
  ],
}
```

### Step 2: 增强 Orchestrator 的计划执行能力（可选）

在 `src/agents/orchestrator.ts` 中添加：

```typescript
## Plan Execution Mode

When you receive a plan (from /plan command or other source):

1. **Analyze the plan**:
   - Detect task domain (bio vs engineering)
   - Identify key steps and dependencies
   - Understand success criteria

2. **Route to appropriate executor**:
   - Bio tasks → internally adopt bio-orchestrator style
   - Engineering tasks → internally adopt engineering-orchestrator style
   - Hybrid tasks → ask user for focus

3. **Execute step by step**:
   - Follow the plan
   - Update progress
   - Handle errors and blockers
   - Ask user questions when needed

This allows seamless Plan → Execute workflow with intelligent routing.
```

### Step 3: 明确 Auto 模式的规划逻辑（重要）

修改 `src/agents/wase.ts` 和 `src/agents/bio-autopilot.ts`：

**wase.ts**：
```typescript
## Heavy Auto Mode - Planning Protocol

When you detect a heavy/complex task:

**Complexity signals**:
- Multiple independent modules (frontend + backend + database)
- Requires architectural decisions
- Spans multiple files/components
- User explicitly mentions "plan", "design", "architecture"

**Planning workflow**:
1. Check for existing plan in `.claude/plans/`
2. If no plan exists:
   - Create plan yourself (you have full context and planning capability)
   - Write to `.claude/plans/{task-name}.md`
   - Use structured format (Context → Design → Implementation → Testing)
3. Execute based on plan:
   - Follow plan step by step
   - Update progress markers
   - Adapt if needed

**DO NOT** reference "prometheus" as an agent - use your own planning capability.
```

**bio-autopilot.ts**：
```typescript
## Heavy Auto Mode - Bio Planning Protocol

When you detect a heavy/complex bio task:

**Complexity signals**:
- Multi-stage analysis pipeline
- Requires study design decisions
- Multiple data types or analyses
- User explicitly mentions "plan", "design", "workflow"

**Planning workflow**:
1. Check for existing plan in `.claude/plans/`
2. If no plan exists:
   - For study design: delegate to `bio-methodologist`
   - For pipeline design: create plan yourself
   - Write to `.claude/plans/{task-name}.md`
   - Use bio-specific format (Context → Data → QC → Analysis → Validation)
3. Execute based on plan:
   - Follow plan step by step
   - Include QC checkpoints
   - Validate results

**DO NOT** reference "prometheus" as an agent - use domain specialists or your own capability.
```

### Step 4: 移除 Full 模式（简化）

Full 模式会暴露所有 agent，包括不应该暴露的 subagent，这违反了设计原则。

```typescript
// src/config/schema/agent-display.ts
// 移除 "full" 模式，只保留 minimal 和 standard
export const AgentDisplayModeSchema = z.enum(["minimal", "standard"])
```

## 最终的 Agent 列表

### Minimal 模式（4-5 个）

适合新手和日常使用：

1. **sisyphus** - 主编排器（最智能，会自动委托）
2. **orchestrator** - 编排器（智能路由，可以接收计划）
3. **wase** - 通用全自动（重型任务会自动规划）
4. **atlas** - 轻量执行（快速简单任务）
5. **bio-autopilot**（如果启用生信领域）- 生信自动驾驶

### Standard 模式（6-7 个）

适合中级用户：

1. **sisyphus**
2. **orchestrator**
3. **wase**
4. **atlas**
5. **hephaestus** - 深度执行（复杂工程任务）
6. **bio-pipeline-operator** - 生信管道执行
7. **bio-autopilot**（如果启用生信领域）

### 系统 Agent（OpenCode 上游，通过命令调用）

- **Plan** - 通过 `/plan` 命令调用
- **Build** - 通过 `/build` 命令调用

## 总结

**关键修改**：
1. ✅ 从显示预设中移除 "prometheus"（它不是 agent）
2. ✅ 保持 7 个 mode="all" 的 agent
3. ✅ 明确 Auto 模式的规划逻辑
4. ✅ 增强 Orchestrator 的计划执行能力
5. ✅ 移除 Full 模式（避免暴露 subagent）

**设计原则**：
- 只暴露 mode="all" 的 agent
- 隐藏 mode="subagent" 的 agent
- 让主 agent 自动委托专家
- 保持用户界面简洁（4-7 个选择）
