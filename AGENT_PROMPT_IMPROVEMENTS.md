# Agent Prompt Improvements - run_in_background Usage

## 问题

主代理（如 Atlas）委托子代理后，使用 `run_in_background=false` 会导致同步等待，无法做其他工作。

## 改进原则

### 何时使用 `run_in_background=true`

1. **并行任务**：多个独立任务可以同时执行
2. **研究类任务**：explore, librarian 等不阻塞主流程的任务
3. **半异步场景**：主代理还有其他工作要做，不需要立即等待结果

### 何时使用 `run_in_background=false`

1. **必须等待结果**：下一步工作依赖当前任务的输出
2. **串行依赖**：任务 B 必须在任务 A 完成后才能开始
3. **最终验证**：需要立即检查结果并可能修复

## 需要改进的 Agent

### 1. Atlas (src/agents/atlas/default.ts)

**当前问题**：
- 并行任务部分说 "Wait for all to complete"，但没有说明应该用 `run_in_background=true`
- 示例代码都是 `run_in_background=false`

**改进方案**：

```typescript
### 3.1 Check Parallelization

**CRITICAL: Use run_in_background correctly**

If tasks can run in parallel (independent, no file conflicts):
- Prepare prompts for ALL parallelizable tasks
- Use `run_in_background=true` for ALL parallel tasks
- Invoke multiple `task()` in ONE message
- Continue with other work while they run
- Check results later with task_id

Example:
```typescript
// Launch 3 independent tasks in parallel
const task1 = task(category="quick", load_skills=[], run_in_background=true, description="Fix auth", prompt="...")
const task2 = task(category="quick", load_skills=[], run_in_background=true, description="Fix types", prompt="...")
const task3 = task(category="quick", load_skills=[], run_in_background=true, description="Add tests", prompt="...")

// Continue with other work...
// Check results later
```

If sequential (task B depends on task A output):
- Use `run_in_background=false` for blocking tasks
- Process one at a time
- Wait for result before next task

Example:
```typescript
// Task A must complete first
const resultA = task(category="quick", load_skills=[], run_in_background=false, description="Create API", prompt="...")

// Use resultA output in task B
const resultB = task(category="quick", load_skills=[], run_in_background=false, description="Add tests for API", prompt=`Test the API created at ${resultA.files}...`)
```

**Rule of thumb**:
- Independent tasks → `run_in_background=true` (parallel)
- Dependent tasks → `run_in_background=false` (sequential)
- Research tasks (explore/librarian) → ALWAYS `run_in_background=true`
```

### 2. Hephaestus (src/agents/hephaestus/agent.ts)

需要检查并添加类似的指导。

### 3. Orchestrator 类 agents

所有编排类 agent 都需要明确说明：
- 何时使用 `run_in_background=true`
- 何时使用 `run_in_background=false`

## 实施步骤

1. ✅ 修复上下文识别问题（已完成）
2. ⬜ 更新 Atlas 提示词（default.ts, gpt.ts, gemini.ts）
3. ⬜ 更新 Hephaestus 提示词
4. ⬜ 更新其他 orchestrator 类 agent
5. ⬜ 添加超时配置说明（当前默认 10 分钟）
6. ⬜ 测试并验证改进效果

## 超时配置

当前配置（src/tools/delegate-task/timing.ts）：
- `DEFAULT_POLL_TIMEOUT_MS = 10 * 60 * 1000` (10 分钟)
- `WAIT_FOR_SESSION_TIMEOUT_MS = 30000` (30 秒)

如果任务经常超时，可以考虑：
1. 增加超时时间
2. 将长任务拆分为多个短任务
3. 使用 `run_in_background=true` 避免阻塞
