# .opencode/openagent-labforge/ 目录结构和使用机制审查

## 目录结构

```
.opencode/openagent-labforge/
├── plans/                    # 计划文件（Prometheus 生成）
│   └── {plan-name}.md
├── drafts/                   # 草稿文件（Prometheus 工作记忆）
│   └── {draft-name}.md
├── checkpoints/              # 上下文压缩检查点
│   ├── auto/
│   │   ├── latest.md
│   │   ├── latest.meta.json
│   │   └── by-session/{sessionID}.md
│   └── manual/
├── runtime/                  # 运行时工作流内存
│   └── {sessionID}/
│       ├── state.json
│       ├── mission.md
│       ├── roadmap.md
│       ├── context-capsule.md
│       ├── context-pressure.json
│       ├── stage-capsule.md
│       ├── stage-anchor.md
│       ├── plan.md
│       ├── build.md
│       ├── review.md
│       └── wave-{NNN}-*.md
├── boulder.json              # 活动计划跟踪
└── swarm/                    # 集群 agent（未来功能）
    └── {swarm-id}/
        ├── state.json
        ├── tasks.json
        ├── results/
        └── messages/
```

---

## 各机制的文件操作详解

### 1. Prometheus（规划系统）

#### 写入的文件：
```
.opencode/openagent-labforge/plans/{name}.md      # 最终计划
.opencode/openagent-labforge/drafts/{name}.md     # 工作草稿
```

#### 工作流程：
```typescript
// Phase 1: Interview（采访阶段）
1. 创建 drafts/{name}.md
2. 持续更新 draft（记录讨论内容）

// Phase 2: Plan Generation（生成计划）
3. 咨询 Metis（gap 分析）
4. 生成计划 → 写入 plans/{name}.md
5. 删除 drafts/{name}.md（清理）

// Phase 3: High Accuracy Review（可选）
6. 用户选择 "High Accuracy Review"
7. 调用 Momus review plans/{name}.md
8. Momus 返回 review 结果（短输出！）
9. Prometheus 根据 review 编辑 plans/{name}.md
10. 重复 7-9 直到 Momus 说 "OKAY"
```

#### Review 输出确认：
```typescript
// Momus 的输出是简短的 review 结果，不是完整计划
// 示例输出（~500 tokens）：
`
REVIEW RESULT: NEEDS_REVISION

Critical Issues:
1. Task 3 missing file path specification
2. Task 7 verification command unclear

Minor Issues:
1. Consider adding rollback step

Recommendations:
- Add specific file paths to Task 3
- Specify exact verification command in Task 7
`

// Prometheus 读取这个 review（500 tokens）
// Prometheus 编辑 plans/{name}.md（只修改问题部分）
// Prometheus 输出简短确认（~100 tokens）：
"✓ Plan updated based on Momus review. Resubmitting for verification."
```

**确认：Review 后的输出是短的！** ✅

---

### 2. Boulder State（活动计划跟踪）

#### 写入的文件：
```
.opencode/openagent-labforge/boulder.json
```

#### 内容：
```json
{
  "active_plan": ".opencode/openagent-labforge/plans/rna-seq-analysis.md",
  "plan_name": "rna-seq-analysis",
  "agent": "atlas",
  "session_ids": ["session-123", "session-456"],
  "session_origins": {
    "session-123": "direct",
    "session-456": "appended"
  },
  "started_at": "2026-04-21T10:00:00Z",
  "worktree_path": null
}
```

#### 操作时机：
- `/ol-start-work` 命令时创建/更新
- 新 session 加入时追加 session_id
- 计划完成时清理

---

### 3. Runtime Workflow（运行时工作流内存）

#### 写入的文件：
```
.opencode/openagent-labforge/runtime/{sessionID}/
├── state.json              # 工作流状态
├── mission.md              # 长期目标
├── roadmap.md              # 路线图
├── context-capsule.md      # 上下文胶囊
├── context-pressure.json   # 上下文压力监控
├── stage-capsule.md        # 阶段胶囊
├── stage-anchor.md         # 阶段锚点
├── plan.md                 # 当前阶段计划
├── build.md                # 构建记录
├── review.md               # 审查记录
└── wave-001-*.md           # 波次文件
```

#### 操作时机：
- `/ol-start-work` 时初始化
- Agent 执行过程中持续更新
- 用于跨 session 的状态恢复

#### 特点：
- **临时文件**，不应该提交到 git
- 用于 compaction-safe 的运行时记忆
- Session 结束后可以清理

---

### 4. Context Compression（上下文压缩）

#### 写入的文件：
```
.opencode/openagent-labforge/checkpoints/
├── auto/
│   ├── latest.md           # 最新自动检查点
│   ├── latest.meta.json    # 元数据
│   └── by-session/{sessionID}.md
└── manual/                 # 手动检查点
```

#### 操作时机：
- 上下文达到阈值时自动触发
- 用户手动执行 `/ol-checkpoint`
- L1/L2/L3 不同级别的压缩

#### 内容：
```markdown
AUTO COMPRESSION CHECKPOINT
===========================

SOURCE SESSION
--------------
- Session ID: xxx
- Created At: 2026-04-21T10:00:00Z
- Checkpoint Kind: light/heavy
- Context Usage: 150K / 200K (75%)

RUNTIME WORKFLOW STATE
----------------------
- Active Plan: rna-seq-analysis.md
- Current Stage: build
- Current Wave: 002

CONTEXT CAPSULE
---------------
[压缩后的上下文摘要...]

STAGE CAPSULE
-------------
[当前阶段的关键信息...]
```

#### 特点：
- **只读**（agent 读取，不修改）
- 用于恢复压缩后的上下文
- 自动清理旧检查点

---

### 5. Swarm（集群 Agent - 未来功能）

#### 计划的文件结构：
```
.opencode/openagent-labforge/swarm/{swarm-id}/
├── state.json              # 集群状态
├── tasks.json              # 任务队列
├── results/                # 结果目录
│   ├── agent-1.json
│   ├── agent-2.json
│   └── agent-3.json
└── messages/               # 消息队列
    ├── 001-agent-1-to-agent-2.json
    ├── 002-agent-2-to-agent-3.json
    └── 003-agent-3-to-all.json
```

#### 设计原则（避免文件泛滥）：
1. **每个 agent 只有一个结果文件**
   - `results/agent-1.json` 持续更新
   - 不是每次思考都创建新文件

2. **消息文件有序命名**
   - 使用序号前缀：`001-`, `002-`, `003-`
   - 便于按时间顺序读取

3. **定期清理**
   - 完成的 swarm 自动归档
   - 超过 24 小时的自动清理

4. **原子操作**
   - 使用 `writeFileAtomically()` 避免冲突
   - 文件锁机制防止并发写入

---

## 文件操作权限控制

### Prometheus 权限
```typescript
permission: {
  edit: {
    "*": "deny",
    ".opencode/openagent-labforge/plans/*.md": "allow",
    ".opencode/openagent-labforge/drafts/*.md": "allow",
  }
}
```

### Atlas/Orchestrator 权限
```typescript
permission: {
  edit: {
    "*": "allow",  // 可以编辑代码
    ".opencode/openagent-labforge/plans/*.md": "deny",  // 不能改计划
  }
}
```

### Swarm Members 权限
```typescript
permission: {
  edit: {
    "*": "allow",  // 可以编辑代码
    ".opencode/openagent-labforge/swarm/{swarm-id}/results/{agent-name}.json": "allow",
    ".opencode/openagent-labforge/swarm/{swarm-id}/messages/*.json": "allow",
  }
}
```

---

## 潜在问题和优化建议

### 问题 1: 文件泛滥风险

**当前风险：**
- Runtime workflow 每个 session 一个目录
- 如果 session 很多，文件会堆积

**建议：**
```typescript
// 自动清理策略
function cleanupOldRuntimeWorkflows(directory: string) {
  const runtimeDir = join(directory, ".opencode/openagent-labforge/runtime")
  const sessions = readdirSync(runtimeDir)
  
  for (const sessionId of sessions) {
    const statePath = join(runtimeDir, sessionId, "state.json")
    const state = readJSON(statePath)
    
    // 清理超过 7 天且已完成的 session
    if (state.completed && isOlderThan(state.completed_at, 7)) {
      rmSync(join(runtimeDir, sessionId), { recursive: true })
    }
  }
}
```

### 问题 2: Checkpoint 文件重复

**当前风险：**
- `checkpoints/auto/by-session/` 每个 session 一个文件
- 可能积累很多

**建议：**
```typescript
// 只保留最近 N 个 checkpoint
const MAX_CHECKPOINTS_PER_SESSION = 3

function cleanupOldCheckpoints(directory: string) {
  const checkpointDir = join(directory, ".opencode/openagent-labforge/checkpoints/auto/by-session")
  const files = readdirSync(checkpointDir)
    .map(f => ({ name: f, mtime: statSync(join(checkpointDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  
  // 删除超过限制的旧文件
  files.slice(MAX_CHECKPOINTS_PER_SESSION).forEach(f => {
    unlinkSync(join(checkpointDir, f.name))
  })
}
```

### 问题 3: Swarm 消息文件管理

**设计建议：**
```typescript
// 消息文件命名规则
function createSwarmMessage(swarmId: string, from: string, to: string, content: any) {
  const timestamp = Date.now()
  const sequence = getNextSequence(swarmId)  // 从 state.json 获取
  const filename = `${sequence.toString().padStart(6, '0')}-${from}-to-${to}.json`
  
  // 写入消息
  writeFileAtomically(
    join(getSwarmDir(swarmId), "messages", filename),
    JSON.stringify({ timestamp, from, to, content }, null, 2)
  )
  
  // 更新序号
  updateSwarmSequence(swarmId, sequence + 1)
}

// 定期清理已读消息
function cleanupReadMessages(swarmId: string) {
  const state = readSwarmState(swarmId)
  
  // 删除所有 agent 都已读的消息
  const allReadSequence = Math.min(...Object.values(state.last_read_sequence))
  
  const messagesDir = join(getSwarmDir(swarmId), "messages")
  const files = readdirSync(messagesDir)
  
  for (const file of files) {
    const sequence = parseInt(file.split('-')[0])
    if (sequence < allReadSequence) {
      unlinkSync(join(messagesDir, file))
    }
  }
}
```

---

## 推荐的文件管理策略

### 1. 分层清理策略

```typescript
// 清理优先级
const CLEANUP_POLICY = {
  // 立即清理
  immediate: [
    "drafts/*.md",  // 计划生成后立即删除
  ],
  
  // 7 天后清理
  weekly: [
    "runtime/{sessionID}/*",  // 完成的 session
    "checkpoints/auto/by-session/*",  // 旧检查点
  ],
  
  // 30 天后清理
  monthly: [
    "swarm/{swarm-id}/*",  // 完成的 swarm
  ],
  
  // 永久保留
  permanent: [
    "plans/*.md",  // 计划文件
    "boulder.json",  // 活动状态
  ],
}
```

### 2. 文件大小限制

```typescript
// 防止单个文件过大
const FILE_SIZE_LIMITS = {
  "plans/*.md": 1_000_000,  // 1MB
  "runtime/*/context-capsule.md": 500_000,  // 500KB
  "swarm/*/results/*.json": 100_000,  // 100KB
  "swarm/*/messages/*.json": 10_000,  // 10KB
}

function enforceFileSizeLimit(path: string, content: string) {
  const limit = getFileSizeLimit(path)
  if (content.length > limit) {
    throw new Error(`File size exceeds limit: ${path} (${content.length} > ${limit})`)
  }
}
```

### 3. 原子写入

```typescript
// 所有写入都使用原子操作
import { writeFileAtomically } from "../../shared/write-file-atomically"

// 避免并发冲突
function updateSwarmResult(swarmId: string, agentName: string, result: any) {
  const path = join(getSwarmDir(swarmId), "results", `${agentName}.json`)
  
  // 原子写入
  writeFileAtomically(path, JSON.stringify(result, null, 2))
}
```

---

## 总结

### ✅ 当前机制合理性

1. **Prometheus 规划**
   - ✅ 计划写入文件，输出简短确认
   - ✅ Review 后输出也是短的
   - ✅ Draft 及时清理

2. **Boulder State**
   - ✅ 单一文件，不会泛滥
   - ✅ 只记录活动计划

3. **Runtime Workflow**
   - ✅ 按 session 隔离
   - ⚠️ 需要定期清理机制

4. **Context Compression**
   - ✅ 自动管理检查点
   - ⚠️ 需要限制数量

### 🔧 需要改进

1. **添加自动清理**
   - Runtime workflow 超过 7 天
   - Checkpoint 超过限制数量
   - Swarm 完成后归档

2. **文件大小限制**
   - 防止单个文件过大
   - 强制分片或压缩

3. **Swarm 文件管理**
   - 消息文件有序命名
   - 定期清理已读消息
   - 结果文件原子更新

### 📋 为 Swarm 做准备

1. **目录结构已规划** ✅
2. **原子写入机制已有** ✅
3. **需要添加清理策略** ⏳
4. **需要添加文件锁** ⏳
