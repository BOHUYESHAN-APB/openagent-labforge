# Agent 架构分析

## 用户需求总结

### 原来的设计（8+2 个 agent）

**8 个用户可见的 agent**：
1. sisyphus - 主编排器
2. wase - 通用全自动
3. atlas - 轻量执行
4. hephaestus - 深度执行
5. orchestrator - 编排器
6. bio-autopilot - 生信自动驾驶
7. bio-pipeline-operator - 生信管道执行
8. ??? - 需要确认第 8 个

**2 个系统 agent**（OpenCode 上游）：
1. Plan - 规划 agent（只读，做计划）
2. Build - 构建 agent（执行计划）

### 当前的问题

#### 问题 1：Plan agent 执行器不匹配

**现象**：
- Plan agent 做完计划后，执行器是普通工程执行器
- 但生信任务需要生信执行器

**原因**：
- OpenCode 的 Plan agent 是通用的，不区分领域
- 执行时没有智能路由到合适的执行器

**解决方案**：
- 需要在 Plan → Build 的交接中加入智能路由
- 或者创建领域特定的 Plan agent（bio-plan, engineering-plan）

#### 问题 2：Auto 模式在重型任务时应该自动规划

**需求**：
- wase 和 bio-autopilot 在遇到重型任务时
- 应该自动调用 Plan 模式做设计
- 设计完后再用自己的 Auto 模式执行

**原因**：
- Auto 的提示词很重，适合强相关任务
- 但重型任务需要先规划再执行

**解决方案**：
- 在 wase 和 bio-autopilot 的 prompt 中添加逻辑
- 检测到重型任务时，先委托 Plan agent
- 然后基于计划执行

## OpenCode 上游的 Agent 系统

### Plan Agent（OpenCode 内置）

**定义**：`src/tools/AgentTool/built-in/planAgent.ts`

**特点**：
- 只读模式（READ-ONLY）
- 不能修改文件
- 只能探索代码库和设计计划
- 输出：实施策略、关键文件列表

**工具限制**：
- 禁用：Agent, ExitPlanMode, Edit, Write, NotebookEdit
- 允许：Read, Glob, Grep, Bash（只读操作）

### Build Agent（OpenCode 内置）

**推测**：
- 执行 Plan agent 生成的计划
- 可以修改文件
- 实际实施代码变更

## Labforge 的 Agent 系统

### Prometheus（Labforge 规划器）

**定义**：`src/agents/prometheus/`

**特点**：
- 类似 OpenCode 的 Plan agent
- 但有智能路由能力（`PROMETHEUS_INTELLIGENT_ROUTING`）
- 可以检测任务类型（生信 vs 工程）
- 内部切换规划风格

**问题**：
- Prometheus 没有在 `builtin-agents.ts` 中注册
- 所以用户看不到它

### Orchestrator（Labforge 编排器）

**定义**：`src/agents/orchestrator.ts`

**特点**：
- mode = "all"（用户可见）
- 有智能路由能力
- 可以执行任务（不只是规划）
- 可以委托子 agent

**我们的修改**：
- 强调它是"执行器"，不是"委托器"
- 只在需要专业调查时委托

### Bio-Orchestrator 和 Engineering-Orchestrator

**定义**：
- `src/agents/bio-orchestrator.ts`
- `src/agents/engineering-orchestrator.ts`

**特点**：
- mode = "subagent"（用户不可见）
- 由 Orchestrator 内部调用
- 领域特定的执行器

## 架构设计问题

### 问题 1：Prometheus vs OpenCode Plan

**当前状态**：
- Prometheus 存在但未注册
- 配置中引用了 "prometheus"
- 但用户看不到

**可能的原因**：
1. Prometheus 是计划中但未完成的功能
2. Prometheus 应该替代 OpenCode 的 Plan agent
3. 配置错误，应该用其他 agent

**需要决定**：
- 是否完成 Prometheus 的注册？
- 还是移除配置中的 "prometheus"？
- 还是用 OpenCode 的 Plan agent？

### 问题 2：Plan → Execute 的路由

**当前流程**：
```
User → Plan agent → 生成计划 → Build agent → 执行
```

**问题**：
- Build agent 不知道任务是生信还是工程
- 可能用错误的执行器

**理想流程**：
```
User → Plan agent（智能路由）→ 生成计划 → 智能选择执行器 → 执行
                ↓
         Bio-Plan / Engineering-Plan
                ↓
         Bio-Executor / Engineering-Executor
```

### 问题 3：Auto 模式的规划能力

**当前状态**：
- wase 和 bio-autopilot 是全自动模式
- 它们的 prompt 提到可以调用 planning agents
- 但没有明确的触发逻辑

**需要的逻辑**：
```typescript
// 在 wase/bio-autopilot 的 prompt 中
if (task.isHeavy && !plan.exists) {
  // 先规划
  task(subagent_type="prometheus", prompt="Plan this task")
  // 等待计划完成
  // 然后基于计划执行
} else {
  // 直接执行
}
```

## 推荐的架构

### 方案 A：完成 Prometheus 注册

**步骤**：
1. 在 `builtin-agents.ts` 中注册 Prometheus
2. Prometheus 作为 Labforge 的规划器（替代 OpenCode Plan）
3. Prometheus 有智能路由，可以区分生信/工程
4. 执行时路由到合适的执行器

**优点**：
- 利用现有的 Prometheus 代码
- 智能路由已经实现
- 符合 Labforge 的设计

**缺点**：
- 需要确保 Prometheus 完整可用
- 可能与 OpenCode Plan 冲突

### 方案 B：使用 OpenCode Plan + 智能路由

**步骤**：
1. 使用 OpenCode 的 Plan agent
2. 在 Plan → Execute 的交接中加入智能路由
3. 根据计划内容选择执行器

**优点**：
- 利用上游的 Plan agent
- 不需要维护自己的规划器

**缺点**：
- 需要修改 OpenCode 的流程
- 智能路由逻辑复杂

### 方案 C：Orchestrator 作为统一入口

**步骤**：
1. Orchestrator 作为主入口（已经是 mode="all"）
2. Orchestrator 检测任务类型和复杂度
3. 重型任务：先规划（内部或委托）再执行
4. 轻型任务：直接执行

**优点**：
- 统一的用户体验
- Orchestrator 已经有智能路由
- 不依赖 OpenCode 的 Plan/Build

**缺点**：
- Orchestrator 的职责变重
- 可能与我们的"执行器"定位冲突

## 推荐的 Agent 列表

### 应该暴露的 Agent（7-8 个）

基于 mode="all" 的原则：

1. **sisyphus** - 主编排器（最智能）
2. **wase** - 通用全自动
3. **atlas** - 轻量执行
4. **hephaestus** - 深度执行
5. **orchestrator** - 编排器（智能路由）
6. **bio-autopilot** - 生信自动驾驶
7. **bio-pipeline-operator** - 生信管道执行
8. **prometheus**（如果注册）- 规划器

### 不应该暴露的 Agent

所有 mode="subagent" 的 agent：
- bio-orchestrator, engineering-orchestrator
- bio-planner
- oracle, librarian, explore, metis, momus
- 所有生信专家
- 所有 swarm agents

## 下一步行动

### 立即需要做的

1. **确认 Prometheus 的状态**
   - 检查 Prometheus 是否完整实现
   - 决定是否注册它
   - 或者从配置中移除

2. **修正显示预设**
   - 如果 Prometheus 不可用，从预设中移除
   - 确保预设中的所有 agent 都已注册

3. **检查 Auto 模式的规划逻辑**
   - 查看 wase 和 bio-autopilot 的 prompt
   - 确认它们是否有自动规划的逻辑
   - 如果没有，添加

### 需要讨论的

1. **Prometheus vs OpenCode Plan**
   - 使用哪个作为规划器？
   - 如何处理冲突？

2. **Plan → Execute 的路由**
   - 在哪里加入智能路由？
   - 如何确保生信任务用生信执行器？

3. **Orchestrator 的定位**
   - 是"执行器"还是"路由器"？
   - 是否应该包含规划能力？
