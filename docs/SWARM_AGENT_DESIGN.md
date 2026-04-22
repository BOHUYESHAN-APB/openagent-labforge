# 集群 Agent (Swarm Agent) 设计方案

## 背景

### 当前架构（主-子委托模式）
```
主 Agent (sisyphus/dispatcher)
  └─ 委托 → 子 Agent (oracle/librarian/explore)
       └─ 返回结果 → 主 Agent
```

**问题：**
- 串行执行，效率低
- 子 agent 之间无法直接通信
- 主 agent 需要协调所有工作

### 目标架构（集群协作模式）
```
协调器 (Swarm Coordinator)
  ├─ Agent-1 ←→ Agent-2  (实时通信)
  ├─ Agent-2 ←→ Agent-3  (并行工作)
  └─ Agent-3 ←→ Agent-1  (共享状态)
```

**优势：**
- 多个专家并行工作
- 实时协作和通信
- 分布式决策

---

## OpenCode 插件机制分析

### Agent 定义（从 OpenCode 源码）
```typescript
// packages/opencode/src/agent/agent.ts
export const Info = z.object({
  name: z.string(),
  description: z.string().optional(),
  mode: z.enum(["subagent", "primary", "all"]),
  native: z.boolean().optional(),
  hidden: z.boolean().optional(),
  permission: Permission.Ruleset.zod,
  model: z.object({
    modelID: ModelID.zod,
    providerID: ProviderID.zod,
  }).optional(),
  prompt: z.string().optional(),
  options: z.record(z.string(), z.any()),
})
```

### 插件 Hook 机制
```typescript
// packages/plugin/src/index.ts
export type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>

export type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>
  project: Project
  directory: string
  worktree: string
  serverUrl: URL
}
```

### 当前委托机制
```typescript
// src/tools/call-omo-agent/tools.ts
// 使用 call_omo_agent 工具进行单向委托
tool({
  args: {
    subagent_type: string,
    prompt: string,
    run_in_background: boolean,
  }
})
```

---

## 集群 Agent 设计

### 1. 核心概念

#### Swarm Coordinator (集群协调器)
- 不是传统的"主 agent"
- 负责初始化集群、监控状态、处理冲突
- 不直接执行任务

#### Swarm Member (集群成员)
- 平等的专家 agent
- 可以直接通信和协作
- 共享工作状态

#### Shared Context (共享上下文)
- 集群级别的状态存储
- 实时同步的工作进度
- 冲突检测和解决

### 2. 架构设计

```
┌─────────────────────────────────────────────────────┐
│           Swarm Coordinator (集群协调器)              │
│  - 初始化集群                                         │
│  - 分配初始任务                                       │
│  - 监控健康状态                                       │
│  - 处理冲突                                          │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Agent-1     │ │  Agent-2     │ │  Agent-3     │
│  (oracle)    │ │  (librarian) │ │  (explore)   │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        └───────────────┴───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Shared Context (共享上下文)   │
        │   - 工作队列                   │
        │   - 完成状态                   │
        │   - 发现结果                   │
        │   - 冲突日志                   │
        └───────────────────────────────┘
```

### 3. 通信机制

#### 方案 A：基于文件的共享状态（推荐）
```typescript
// .opencode/openagent-labforge/swarm/{swarm-id}/
// ├── state.json          # 集群状态
// ├── tasks.json          # 任务队列
// ├── results/            # 结果目录
// │   ├── agent-1.json
// │   ├── agent-2.json
// │   └── agent-3.json
// └── messages/           # 消息队列
//     ├── 001-agent-1-to-agent-2.json
//     ├── 002-agent-2-to-agent-3.json
//     └── 003-agent-3-to-all.json
```

**优势：**
- 利用 OpenCode 现有的文件系统
- 易于调试和监控
- 持久化状态

**实现：**
```typescript
interface SwarmState {
  swarm_id: string
  coordinator: string
  members: SwarmMember[]
  status: "initializing" | "running" | "paused" | "completed" | "failed"
  created_at: string
  updated_at: string
}

interface SwarmMember {
  agent_name: string
  session_id: string
  status: "idle" | "working" | "waiting" | "completed"
  current_task?: string
  last_heartbeat: string
}

interface SwarmTask {
  task_id: string
  description: string
  assigned_to?: string
  status: "pending" | "in_progress" | "completed" | "failed"
  dependencies: string[]
  result?: any
}

interface SwarmMessage {
  message_id: string
  from: string
  to: string | "all"
  type: "request" | "response" | "broadcast" | "query"
  content: any
  timestamp: string
}
```

#### 方案 B：基于 Hook 的事件总线
```typescript
// 使用 OpenCode 的 hook 机制实现事件总线
export function createSwarmHook(ctx: PluginInput) {
  const eventBus = new SwarmEventBus()
  
  return {
    "chat.message": async (input, output) => {
      // 拦截消息，检测是否是集群通信
      if (isSwarmMessage(input)) {
        await eventBus.dispatch(input)
      }
    }
  }
}
```

### 4. 工作流程

#### 初始化集群
```typescript
// 用户命令: /swarm "分析这个代码库的架构"
// 或使用工具: swarm_create(...)

1. Coordinator 创建集群状态文件
2. 分析任务，确定需要哪些专家
3. 启动多个 agent session (并行)
4. 初始化共享上下文
5. 分配初始任务
```

#### 任务执行
```typescript
// Agent-1 (oracle) 的工作流程
1. 从共享任务队列获取任务
2. 执行任务
3. 如果需要其他专家的信息:
   - 发送消息到消息队列
   - 等待响应或继续其他任务
4. 完成后更新结果到共享上下文
5. 通知其他 agent
```

#### 实时协作示例
```typescript
// 场景：分析代码库架构

// Coordinator 分配任务:
tasks = [
  { id: "1", desc: "找出所有 API 端点", assign: "explore" },
  { id: "2", desc: "分析数据库模式", assign: "oracle" },
  { id: "3", desc: "查找依赖库文档", assign: "librarian" },
]

// Agent 并行工作:
explore: 搜索代码 → 发现 API 文件 → 写入 results/explore.json
oracle:  分析架构 → 需要 API 信息 → 读取 results/explore.json → 继续分析
librarian: 查文档 → 发现新库 → 广播消息 "发现新依赖: X" → 其他 agent 收到

// 最终汇总:
Coordinator 读取所有 results/*.json → 生成综合报告
```

---

## 实现方案

### Phase 1: 基础设施（2-3天）

#### 1.1 创建 Swarm 状态管理
```typescript
// src/features/swarm-state/index.ts
export class SwarmStateManager {
  constructor(private directory: string) {}
  
  createSwarm(config: SwarmConfig): SwarmState
  getSwarm(swarmId: string): SwarmState | null
  updateSwarm(swarmId: string, updates: Partial<SwarmState>): void
  deleteSwarm(swarmId: string): void
  
  // 任务管理
  addTask(swarmId: string, task: SwarmTask): void
  getNextTask(swarmId: string, agentName: string): SwarmTask | null
  completeTask(swarmId: string, taskId: string, result: any): void
  
  // 消息管理
  sendMessage(swarmId: string, message: SwarmMessage): void
  getMessages(swarmId: string, agentName: string): SwarmMessage[]
  
  // 结果管理
  writeResult(swarmId: string, agentName: string, result: any): void
  readResult(swarmId: string, agentName: string): any
  getAllResults(swarmId: string): Record<string, any>
}
```

#### 1.2 创建 Swarm Coordinator Agent
```typescript
// src/agents/swarm-coordinator.ts
export function createSwarmCoordinatorAgent(model: string): AgentConfig {
  return {
    description: "Swarm coordinator for managing multi-agent collaboration",
    mode: "all",
    model,
    prompt: `
You are a swarm coordinator managing multiple expert agents working in parallel.

Your responsibilities:
1. Analyze the user's request and break it into parallel tasks
2. Determine which expert agents are needed
3. Initialize the swarm and assign initial tasks
4. Monitor progress and handle conflicts
5. Synthesize results from all agents

Available experts:
- oracle: Architecture and design decisions
- librarian: Documentation and API references
- explore: Codebase exploration
- bio-methodologist: Bioinformatics methods
- paper-evidence-synthesizer: Literature research

Swarm workflow:
1. Create swarm: swarm_create(description, members)
2. Assign tasks: swarm_assign_task(agent, task)
3. Monitor: swarm_status()
4. Get results: swarm_results()
5. Finalize: swarm_complete()
    `,
  }
}
```

#### 1.3 创建 Swarm Tools
```typescript
// src/tools/swarm/tools.ts
export function createSwarmTools(ctx: PluginInput): ToolDefinition[] {
  return [
    tool({
      name: "swarm_create",
      description: "Create a new swarm of agents for parallel collaboration",
      args: {
        description: tool.schema.string(),
        members: tool.schema.array(tool.schema.string()),
        tasks: tool.schema.array(tool.schema.object({
          description: tool.schema.string(),
          assigned_to: tool.schema.string().optional(),
        })),
      },
      async execute(args) {
        // 创建集群状态
        // 启动多个 agent session
        // 返回 swarm_id
      }
    }),
    
    tool({
      name: "swarm_status",
      description: "Get current status of the swarm",
      args: {
        swarm_id: tool.schema.string(),
      },
      async execute(args) {
        // 读取集群状态
        // 返回每个 agent 的进度
      }
    }),
    
    tool({
      name: "swarm_results",
      description: "Get results from all swarm members",
      args: {
        swarm_id: tool.schema.string(),
      },
      async execute(args) {
        // 读取所有结果
        // 返回汇总
      }
    }),
  ]
}
```

### Phase 2: Agent 通信（3-4天）

#### 2.1 Swarm Member Prompt
```typescript
// 每个 swarm member 的 prompt 增强
const SWARM_MEMBER_CAPABILITY = `
## Swarm Collaboration

You are part of a swarm (ID: {swarm_id}) working with other expert agents.

**Swarm directory**: .opencode/openagent-labforge/swarm/{swarm_id}/

**Your role**: {agent_role}
**Other members**: {other_members}

**Collaboration tools**:
- swarm_get_task(): Get next task from queue
- swarm_complete_task(task_id, result): Mark task complete
- swarm_send_message(to, content): Send message to another agent
- swarm_read_messages(): Read messages sent to you
- swarm_read_result(agent_name): Read another agent's results
- swarm_broadcast(content): Send message to all agents

**Workflow**:
1. Get task: task = swarm_get_task()
2. Work on task
3. If you need info from another agent:
   - Check their results: swarm_read_result("oracle")
   - Or send message: swarm_send_message("oracle", "需要架构信息")
4. Complete task: swarm_complete_task(task.id, result)
5. Repeat until no more tasks

**Important**:
- Work independently but check shared context frequently
- Don't wait for responses if you can continue with other tasks
- Update your heartbeat regularly
`
```

#### 2.2 消息传递机制
```typescript
// src/features/swarm-state/message-bus.ts
export class SwarmMessageBus {
  async sendMessage(swarmId: string, message: SwarmMessage): Promise<void> {
    const messagePath = path.join(
      getSwarmDir(swarmId),
      "messages",
      `${Date.now()}-${message.from}-to-${message.to}.json`
    )
    await writeFile(messagePath, JSON.stringify(message, null, 2))
  }
  
  async getMessages(swarmId: string, agentName: string): Promise<SwarmMessage[]> {
    const messagesDir = path.join(getSwarmDir(swarmId), "messages")
    const files = await readdir(messagesDir)
    
    const messages = []
    for (const file of files) {
      const content = await readFile(path.join(messagesDir, file), "utf-8")
      const message = JSON.parse(content)
      
      // 只返回发给这个 agent 或广播的消息
      if (message.to === agentName || message.to === "all") {
        messages.push(message)
      }
    }
    
    return messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }
}
```

### Phase 3: 用户界面（2-3天）

#### 3.1 命令接口
```typescript
// src/features/builtin-commands/swarm.ts
export const SWARM_COMMAND = {
  name: "swarm",
  description: "Create a swarm of agents for parallel collaboration",
  template: `
<command-instruction>
You are about to create a swarm of expert agents to work on this task in parallel.

<user-request>
{user_request}
</user-request>

Analyze the request and:
1. Identify which expert agents are needed
2. Break down into parallel tasks
3. Create the swarm with swarm_create()
4. Monitor progress with swarm_status()
5. Synthesize results with swarm_results()
</command-instruction>
  `,
}
```

#### 3.2 TUI 显示
```typescript
// 在 Ctrl+O 界面显示集群状态
Swarm: bio-analysis-001
├─ Coordinator: swarm-coordinator
├─ Members:
│  ├─ [WORKING] bio-methodologist: "分析 RNA-seq 数据"
│  ├─ [WORKING] paper-evidence-synthesizer: "查找相关文献"
│  └─ [IDLE] wet-lab-designer: 等待前置任务
└─ Progress: 2/5 tasks completed
```

---

## 使用场景

### 场景 1: 代码库架构分析
```bash
/swarm "分析这个代码库的完整架构，包括 API、数据库、依赖关系"

# Swarm 创建:
- explore: 搜索所有源文件，找出模块结构
- oracle: 分析架构模式和设计决策
- librarian: 查找依赖库文档
- momus: 评估代码质量

# 并行工作:
explore 和 oracle 同时工作
librarian 查找 explore 发现的依赖
momus 审查 oracle 的分析结果

# 最终输出:
综合报告，包含架构图、依赖关系、质量评估
```

### 场景 2: 生信分析流程
```bash
/swarm "设计并执行 RNA-seq 差异表达分析"

# Swarm 创建:
- bio-methodologist: 设计分析流程
- paper-evidence-synthesizer: 查找最佳实践文献
- bio-pipeline-operator: 准备执行脚本
- wet-lab-designer: 设计验证实验

# 并行工作:
methodologist 和 paper-synthesizer 同时研究方法
pipeline-operator 根据 methodologist 的设计准备脚本
wet-lab-designer 根据预期结果设计验证

# 最终输出:
完整的分析流程 + 执行脚本 + 验证方案
```

---

## 技术挑战和解决方案

### 挑战 1: 并发控制
**问题**: 多个 agent 同时修改文件可能冲突

**解决方案**:
- 使用文件锁机制
- 每个 agent 有独立的工作目录
- 共享状态使用原子操作（读-修改-写）

### 挑战 2: 死锁检测
**问题**: Agent-1 等待 Agent-2，Agent-2 等待 Agent-1

**解决方案**:
- Coordinator 监控依赖关系
- 设置超时机制
- 允许 agent 跳过阻塞任务，先做其他任务

### 挑战 3: 结果一致性
**问题**: 多个 agent 的结果可能矛盾

**解决方案**:
- Coordinator 负责冲突检测
- 使用投票机制或优先级
- 记录所有冲突供用户决策

### 挑战 4: 性能开销
**问题**: 多个 agent 并行运行消耗大量资源

**解决方案**:
- 限制并发 agent 数量（默认 3-5 个）
- 使用轻量级 agent（haiku 模型）
- 实现 agent 池和复用

---

## 配置选项

```typescript
// openagent-labforge.json
{
  "swarm": {
    "enabled": true,
    "max_concurrent_agents": 5,
    "default_timeout_ms": 300000,
    "heartbeat_interval_ms": 5000,
    "auto_cleanup": true,
    "cleanup_after_hours": 24
  }
}
```

---

## 下一步

1. **Phase 1 实现** (本周)
   - 创建 SwarmStateManager
   - 实现基础的文件共享机制
   - 创建 swarm-coordinator agent

2. **Phase 2 实现** (下周)
   - 实现消息传递
   - 增强 agent prompt
   - 测试并行执行

3. **Phase 3 实现** (第三周)
   - 添加用户命令
   - 实现 TUI 显示
   - 编写文档和示例

4. **测试和优化** (第四周)
   - 性能测试
   - 冲突处理测试
   - 用户体验优化
