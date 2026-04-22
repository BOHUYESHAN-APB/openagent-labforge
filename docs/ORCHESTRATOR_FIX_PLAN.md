# Orchestrator 修复计划

## 问题总结

当前 orchestrator 的设计存在严重的概念混淆，导致它总是委托子代理去做任务，而不是自己执行。这造成了：

1. **失去交互能力**：子代理不能问用户问题，导致规划质量下降
2. **过度委托**：即使是简单任务也会委托，增加了复杂度和 token 消耗
3. **角色混乱**：orchestrator 变成了"任务分发器"而不是"智能执行者"

## 核心原则（正确的设计）

### 1. Orchestrator 的主要职责

**Orchestrator 应该自己执行大部分任务**，包括：
- 规划任务（planning）
- 编写代码（coding）
- 分析问题（analysis）
- 与用户交互（asking questions）

**Orchestrator 只在以下情况委托**：
- 需要专业调查（explore 代码库、librarian 查文档、github-scout 搜索 issues）
- 需要专家审查（oracle 架构建议、metis 设计模式、momus 代码审查）
- 需要并行执行（swarm 模式）

### 2. "Internally adopt" vs "Delegate to"

**错误理解**：
```
Bioinformatics domain → Delegate to bio-planner
Engineering domain → Delegate to engineering specialists
```

**正确理解**：
```
Bioinformatics domain → Orchestrator 自己采用 bio 规划风格
Engineering domain → Orchestrator 自己采用 engineering 规划风格
```

### 3. 委托的正确时机

**应该委托的场景**：
```typescript
// 场景 1：需要深度代码探索
task(
  subagent_type="explore",
  prompt="Find all authentication-related files and their dependencies"
)

// 场景 2：需要查询文档
task(
  subagent_type="librarian",
  prompt="How to use React Query for data fetching?"
)

// 场景 3：需要架构建议
task(
  subagent_type="oracle",
  prompt="Review this API design and suggest improvements"
)

// 场景 4：需要并行执行
task(
  subagent_type="swarm-coordinator",
  prompt="Develop frontend, backend, and database in parallel"
)
```

**不应该委托的场景**：
```typescript
// ❌ 错误：委托规划任务
task(
  subagent_type="bio-planner",
  prompt="Create a plan for RNA-seq analysis"
)

// ✅ 正确：自己做规划
// Orchestrator 直接问用户问题，收集需求，生成计划
```

## 修复方案

### 修复 1：重写 orchestrator.ts

**当前问题**：
- 第 84-94 行：混淆了"adopt"和"delegate"
- 第 140-145 行：暗示应该委托给 bio specialists
- 第 159-164 行：暗示应该委托给 engineering specialists

**修复方案**：
1. 明确说明：Orchestrator **自己执行**任务，**内部采用**不同的风格
2. 列出的 specialists 应该标注为"**可选的调查工具**"，而不是"必须委托的对象"
3. 添加明确的"何时委托 vs 何时自己做"的指导

### 修复 2：重写 bio-orchestrator.ts 和 engineering-orchestrator.ts

**当前问题**：
- 这两个 agent 可能也有过度委托的问题

**修复方案**：
1. 明确它们是"执行型 orchestrator"，不是"委托型 orchestrator"
2. 它们应该自己执行任务，只在需要专业调查时委托

### 修复 3：重写 intelligent-routing.ts

**当前问题**：
- 虽然注释说得对（internally adopt），但实际指导可能不够清晰

**修复方案**：
1. 强调：routing 是**内部风格切换**，不是**委托给其他 agent**
2. 添加反例：明确说明"不要委托给 bio-planner"

### 修复 4：审查所有 orchestrator 相关的 prompt

需要检查的文件：
- `src/agents/orchestrator.ts`
- `src/agents/bio-orchestrator.ts`
- `src/agents/engineering-orchestrator.ts`
- `src/agents/prometheus/intelligent-routing.ts`
- `src/agents/prometheus/system-prompt.ts`

确保所有地方都传达一致的信息：
- Orchestrator **自己执行**任务
- Orchestrator **可以委托**专业调查
- Orchestrator **不应该委托**规划和核心执行

### 修复 5：Swarm 系统的定位

**Swarm 的正确定位**：
- Swarm 是**特殊的并行执行模式**
- 只在任务可以**完全独立并行**时使用
- Swarm coordinator 负责**任务分解和结果聚合**
- Swarm workers 负责**独立执行子任务**

**Swarm 不应该**：
- 用于顺序依赖的任务
- 用于需要频繁交互的任务
- 用于简单的单一任务

## 实施步骤

### Step 1: 重写 orchestrator.ts（高优先级）

修改内容：
1. 删除或重写第 84-94 行，明确"internally adopt"的含义
2. 重写第 140-145 行和 159-164 行，将 specialists 标注为"可选工具"
3. 添加"何时自己做 vs 何时委托"的明确指导
4. 添加反例：明确说明不要委托规划任务

### Step 2: 重写 bio-orchestrator.ts 和 engineering-orchestrator.ts（高优先级）

修改内容：
1. 明确它们是"执行型"而不是"委托型"
2. 强调自己执行任务的能力
3. 列出委托的正确时机

### Step 3: 审查 intelligent-routing.ts（中优先级）

修改内容：
1. 强化"内部风格切换"的概念
2. 添加反例和警告

### Step 4: 测试和验证（高优先级）

测试场景：
1. 用户请求"创建一个 RNA-seq 分析计划"
   - 期望：Orchestrator 自己问问题、收集需求、生成计划
   - 不期望：Orchestrator 委托给 bio-planner

2. 用户请求"重构这个认证模块"
   - 期望：Orchestrator 自己分析代码、提出方案、执行重构
   - 可选：Orchestrator 委托 explore 探索代码库（如果需要）

3. 用户请求"并行开发前端、后端、数据库"
   - 期望：Orchestrator 委托给 swarm-coordinator
   - Swarm coordinator 分解任务并启动 workers

### Step 5: 文档更新（低优先级）

更新文档：
- 更新 README 中关于 orchestrator 的描述
- 更新 SWARM_AGENT_DESIGN.md
- 创建 ORCHESTRATOR_DESIGN.md 说明正确的设计

## 关键要点

1. **Orchestrator 是执行者，不是分发器**
2. **委托是例外，不是常态**
3. **规划任务必须由 orchestrator 自己完成**（这样才能问用户问题）
4. **Swarm 是特殊的并行模式**，不是常规委托

## 风险和注意事项

1. **向后兼容性**：修改后可能影响现有用户的使用习惯
2. **Token 消耗**：Orchestrator 自己执行可能消耗更多 tokens（但提供更好的体验）
3. **测试覆盖**：需要充分测试各种场景，确保修复有效

## 成功标准

修复成功的标志：
1. ✅ Orchestrator 能够自己完成规划任务
2. ✅ Orchestrator 能够问用户问题
3. ✅ Orchestrator 只在需要专业调查时委托
4. ✅ Swarm 系统正常工作，用于并行任务
5. ✅ 用户体验改善，不再出现"对话直接结束"的问题
