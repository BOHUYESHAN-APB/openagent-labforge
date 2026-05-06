# OpenAgent Labforge 详细设计规格说明书

> **版本**: 3.15.2 | **仓库**: [BOHUYESHAN-APB/openagent-labforge](https://github.com/BOHUYESHAN-APB/openagent-labforge)
> **npm**: `@bohuyeshan/openagent-labforge-core` | **许可**: SUL-1.0 (正在迁移至 Apache-2.0)
> **技术栈**: TypeScript (strict), Bun, Zod v4, OpenCode Plugin SDK

---

## 1. 项目概述

### 1.1 项目定位

OpenAgent Labforge 是 `code-yeongyu/oh-my-opencode` 的 fork 版本，是一个面向 OpenCode 的全功能插件，提供多智能体编排、生命周期钩子系统、工具集、技能系统、MCP 服务器管理和生物信息学专用工作流。

### 1.2 核心能力

| 能力领域 | 说明 |
|---------|------|
| 工程编排 | 多智能体任务分配、执行、规划、审查 |
| 生物信息学 | 完整生信 pipeline（文献→数据→计算→湿实验验证） |
| 自主执行 | light/heavy + batch/continuous 四种模式，支持自动多波次执行 |
| 上下文管理 | L1/L2/L3 三级压缩 + Magic Context 缓存感知压缩 |
| 运行时记忆 | 仓库级运行时 workflow memory（mission/roadmap/stage/wave） |
| 检查点系统 | 跨会话检查点、版本化回滚、持久化执行状态 |
| 技能系统 | TypeScript 内置技能 + 文件式技能包双形态 |
| MCP 集成 | 内置/Claude Code/技能嵌入三层 MCP |

---

## 2. 项目结构

```
openagent-labforge/
├── src/
│   ├── index.ts                 # 插件入口：5步初始化
│   ├── plugin-config.ts         # 多级配置加载（用户→项目→默认）
│   ├── create-managers.ts       # 创建4个管理器
│   ├── create-tools.ts          # 创建技能上下文+分类+工具注册表
│   ├── create-hooks.ts          # 3层钩子组合（Core+Continuation+Skill）
│   ├── plugin-interface.ts      # 8个 OpenCode 钩子处理器
│   ├── plugin-dispose.ts        # 插件清理
│   ├── plugin-state.ts          # 模型缓存状态
│   │
│   ├── agents/                  # 34+ 智能体定义
│   │   ├── builtin-agents.ts    # 智能体注册表
│   │   ├── sisyphus/            # 主编排器（含子目录）
│   │   ├── hephaestus/          # 自主深度工作者
│   │   ├── atlas/               # Todo 列表编排器
│   │   ├── prometheus/          # 策略规划器（含子目录）
│   │   ├── sisyphus-junior/     # 分类委派执行器
│   │   ├── historian/           # 历史记录整理
│   │   ├── builtin-agents/      # 条件工厂（agent配置构建器）
│   │   ├── bio-*.ts             # 生物信息学智能体（7个）
│   │   └── types.ts             # AgentFactory, AgentMode 等类型
│   │
│   ├── hooks/                   # 46个生命周期钩子（79个目录/文件）
│   │   ├── index.ts             # 钩子汇总导出
│   │   ├── context-window-monitor/   # 上下文窗口监控
│   │   ├── session-recovery/         # 会话恢复
│   │   ├── model-fallback/           # 模型自动回退
│   │   ├── ralph-loop/               # 自主执行循环
│   │   ├── todo-continuation-enforcer/ # Todo 继续执行
│   │   ├── anthropic-effort/         # Anthropic effort 调节
│   │   ├── magic-context/            # Magic Context 相关钩子
│   │   ├── zauc-mocks-*/             # ZAUC 模拟钩子（4个）
│   │   ├── comment-checker/          # AI 注释检查
│   │   ├── rules-injector/           # 规则注入
│   │   └── ...                       # 其余39个钩子
│   │
│   ├── tools/                   # 25+ 工具（22个目录）
│   │   ├── index.ts             # 工具汇总导出
│   │   ├── delegate-task/       # 核心委派工具 task()
│   │   ├── background-task/     # 后台任务管理
│   │   ├── session-manager/     # 会话历史查询
│   │   ├── lsp/                 # LSP 重构（6个工具）
│   │   ├── ast-grep/            # AST 模式搜索
│   │   ├── grep/                # 文件内容搜索
│   │   ├── glob/                # 文件模式匹配
│   │   ├── skill/               # 技能加载
│   │   ├── skill-mcp/           # 技能内嵌 MCP
│   │   ├── call-omo-agent/      # 直接智能体调用
│   │   ├── look-at/             # 多模态媒体分析
│   │   ├── recall/              # 运行时记忆读取
│   │   ├── batch/               # 批量只读操作
│   │   ├── magic-context/       # Magic Context（4个工具）
│   │   ├── task/                # 任务 CRUD（4个工具）
│   │   ├── interactive-bash/    # 交互式 Bash/Tmux
│   │   ├── hashline-edit/       # 精确行级编辑
│   │   ├── slashcommand/        # 斜杠命令发现
│   │   └── image-generate/      # 图片生成
│   │
│   ├── features/                # 19个功能模块（24个目录）
│   │   ├── background-agent/    # 后台智能体管理
│   │   ├── builtin-skills/      # TypeScript 内置技能（54个技能文件）
│   │   ├── builtin-commands/    # 内置斜杠命令
│   │   ├── tmux-subagent/       # Tmux 子会话管理
│   │   ├── skill-mcp-manager/   # 技能内嵌 MCP 管理
│   │   ├── context-injector/    # 上下文注入引擎
│   │   ├── model-governor/      # 模型治理（自动推荐）
│   │   ├── magic-context/       # Magic Context 核心实现
│   │   ├── mcp-oauth/           # MCP OAuth 认证
│   │   ├── task-toast-manager/  # Toast 通知管理
│   │   ├── boulder-state/       # Boulder 执行状态
│   │   ├── run-continuation-state/ # 运行继续状态
│   │   ├── swarm-launcher/      # Swarm 启动器
│   │   ├── swarm-state/         # Swarm 状态
│   │   ├── tool-metadata-store/ # 工具元数据存储
│   │   ├── hook-message-injector/ # 钩子消息注入
│   │   ├── opencode-skill-loader/ # OpenCode 技能加载器
│   │   ├── claude-code-agent-loader/ # Claude Code 智能体加载器
│   │   ├── claude-code-command-loader/ # Claude Code 命令加载器
│   │   ├── claude-code-mcp-loader/ # Claude Code MCP 加载器
│   │   ├── claude-code-plugin-loader/ # Claude Code 插件加载器
│   │   └── claude-code-session-state/ # Claude Code 会话状态
│   │
│   ├── cli/                     # CLI 工具（30个目录/文件）
│   │   ├── index.ts             # CLI 入口
│   │   ├── cli-program.ts       # Commander.js 主程序
│   │   ├── install.ts           # 交互式安装
│   │   ├── run/                 # 非交互式运行
│   │   ├── doctor/              # 健康诊断检查
│   │   ├── config-manager/      # 配置管理
│   │   └── mcp-oauth/           # MCP OAuth CLI
│   │
│   ├── plugin/                  # OpenCode 钩子处理器（39个文件）
│   │   ├── hooks/               # 钩子组合（6个文件）
│   │   ├── tool-registry.ts     # 工具注册表
│   │   ├── chat-message.ts      # chat.message 处理器
│   │   ├── chat-params.ts       # chat.params 处理器
│   │   ├── chat-headers.ts      # chat.headers 处理器
│   │   ├── event.ts             # event 处理器
│   │   ├── tool-execute-before.ts # 工具执行前处理器
│   │   ├── tool-execute-after.ts  # 工具执行后处理器
│   │   ├── messages-transform.ts  # 消息变换处理器
│   │   ├── system-transform.ts    # 系统消息变换
│   │   ├── skill-context.ts     # 技能上下文创建
│   │   ├── available-categories.ts # 可用分类构建
│   │   ├── bootstrap-mode.ts    # 引导模式
│   │   ├── compacting-handler.ts # 压缩处理器
│   │   ├── settings-command.ts  # 设置命令
│   │   └── types.ts             # PluginContext, PluginInterface 等类型
│   │
│   ├── plugin-handlers/         # 配置处理器（24个文件）
│   │   ├── config-handler.ts    # 6阶段配置加载
│   │   ├── agent-config-handler.ts  # 智能体配置构建
│   │   ├── mcp-config-handler.ts    # MCP 配置构建
│   │   ├── command-config-handler.ts # 命令配置构建
│   │   ├── tool-config-handler.ts   # 工具配置构建
│   │   ├── provider-config-handler.ts # 提供商配置构建
│   │   ├── category-config-resolver.ts # 分类配置解析
│   │   └── plugin-components-loader.ts # 插件组件加载器
│   │
│   ├── config/                  # Zod v4 配置模式系统（4个子目录+主文件）
│   │   ├── index.ts             # 类型导出
│   │   ├── schema.ts            # 根 Schema 定义
│   │   └── schema/              # 35个模块化 Schema 文件
│   │
│   ├── mcp/                     # 内置 MCP（10个文件/目录）
│   │   ├── index.ts             # MCP 汇总
│   │   ├── websearch.ts         # Web 搜索（Exa/Tavily）
│   │   ├── context7.ts          # Context7 文档查询
│   │   ├── grep-app.ts          # GitHub 代码搜索
│   │   ├── extended.ts          # 扩展 MCP
│   │   └── types.ts             # MCP 类型定义
│   │
│   ├── shared/                  # 共享工具库（143个文件）
│   ├── tui/                     # TUI 相关模块
│   └── openclaw/                # OpenClaw 集成
│
├── packages/                    # Monorepo：cli-runner + 12个平台二进制
├── generated/skills-bundles/    # 文件式技能包（full/paper/bio）
├── docs/                        # 文档
├── tests/                       # 测试
├── bin/                         # 二进制入口
└── scripts/                     # 构建脚本
```

---

## 3. 初始化流程

### 3.1 插件加载流程图

```
OpenAgentLabforgePlugin(ctx)
  │
  ├─1. injectServerAuthIntoClient(ctx.client)    # 注入服务端认证
  ├─2. startTmuxCheck()                          # 启动 Tmux 状态检查
  │
  ├─3. loadPluginConfig(directory, ctx)           # 配置加载
  │   ├─ 用户级: ~/.config/opencode/openagent-labforge.jsonc
  │   ├─ 项目级: .opencode/openagent-labforge.jsonc
  │   ├─ mergeConfigs(user, project)              # 深度合并
  │   │   ├─ agents/categories: 递归深度合并
  │   │   ├─ disabled_*: Set 并集
  │   │   └─ 其他: 覆盖
  │   ├─ Zod safeParse() ─ 填充默认值
  │   └─ migrateConfigFile() ─ 转换遗留键名
  │
  ├─4. resolveAgentDisplayLanguage()             # i18n 语言解析
  ├─5. applyModelGovernor()                      # 自动模型治理
  │
  ├─6. createManagers()                           # 创建管理器
  │   ├─ TmuxSessionManager(ctx, tmuxConfig)      # Tmux 会话管理
  │   ├─ BackgroundManager(ctx, config, callbacks) # 后台任务管理
  │   ├─ SkillMcpManager()                        # 技能 MCP 管理
  │   └─ createConfigHandler()                    # 6阶段配置处理器
  │
  ├─7. createTools()                              # 创建工具系统
  │   ├─ createSkillContext()                     # 技能上下文
  │   ├─ createAvailableCategories()              # 可用分类
  │   └─ createToolRegistry()                     # 工具注册表（25+工具）
  │
  ├─8. createHooks()                              # 创建钩子系统
  │   ├─ createCoreHooks()                        # 核心钩子（37个）
  │   │   ├─ createSessionHooks()                 # 会话钩子（24个）
  │   │   ├─ createToolGuardHooks()               # 工具守卫钩子（12个）
  │   │   └─ createTransformHooks()               # 变换钩子（5个）
  │   ├─ createContinuationHooks()                # 继续执行钩子（7个）
  │   └─ createSkillHooks()                       # 技能钩子（2个）
  │
  └─9. createPluginInterface()                    # 组装 OpenCode 接口
      ├─ tool: filteredTools                      # 工具注册
      ├─ chat.params: anthropicEffort             # 对话参数
      ├─ chat.headers: x-initiator               # 对话头部
      ├─ chat.message: 首消息+会话设置            # 消息处理
      ├─ event: 会话生命周期                      # 事件处理
      ├─ tool.execute.before: 预执行守卫          # 工具执行前
      ├─ tool.execute.after: 后执行处理           # 工具执行后
      ├─ experimental.chat.messages.transform     # 消息变换
      ├─ experimental.chat.system.transform       # 系统消息变换
      └─ command.execute.before: autoSlashCommand # 命令执行前
```

### 3.2 配置加载详细流程

```
loadPluginConfig(directory, ctx)
  ├─1. 检测用户级配置文件（.jsonc > .json）
  ├─2. 检测项目级配置文件（.jsonc > .json）
  ├─3. 检测并迁移遗留配置文件名
  ├─4. 加载用户配置（parseJsonc → migrateConfigFile → Zod safeParse）
  ├─5. 加载项目配置（同上）
  ├─6. mergeConfigs(用户, 项目)
  ├─7. 初始化默认模型偏好（DeepSeek 优先）
  └─8. 返回合并后的有效配置
```

### 3.3 Model Governor（模型治理）

- 自动发现可用模型
- 生成模型推荐报告
- DeepSeek V4 优先推荐策略
- 存储于 repo-local runtime 状态

---

## 4. 智能体系统

### 4.1 智能体清单

#### 4.1.1 工程编排智能体

| 智能体 | 模式 | 温度 | 默认模型 | 职责 |
|--------|------|------|---------|------|
| **sisyphus** | all | 0.1 | claude-opus-4-6 max | 主编排器：计划+委派 |
| **sisyphus-junior** | all | 0.1 | claude-sonnet-4-6 | 分类委派执行器（task() 使用）|
| **wase** | all | 0.1 | gpt-5.4 medium | 全自主编排器（工程自动模式入口）|
| **hephaestus** | all | 0.1 | gpt-5.3-codex medium | 自主深度工作者（代码实现专家）|
| **atlas** | primary | 0.1 | claude-sonnet-4-6 | Todo 列表编排器 |
| **prometheus** | subagent | 0.1 | claude-opus-4-6 max | 策略规划器（计划+设计）|
| **metis** | subagent | **0.3** | claude-opus-4-6 max | 预规划顾问 |
| **momus** | subagent | 0.1 | gpt-5.4 xhigh | 计划审查者 |
| **oracle** | subagent | 0.1 | gpt-5.4 high | 只读咨询（架构设计、调试）|
| **executor** | - | 0.1 | - | 智能执行器（自动路由到 bio/工程）|
| **orchestrator** | - | 0.1 | - | 通用编排器 |
| **engineering-orchestrator** | - | 0.1 | - | 工程编排器 |

#### 4.1.2 搜索与文档智能体

| 智能体 | 模式 | 温度 | 默认模型 | 职责 |
|--------|------|------|---------|------|
| **explore** | subagent | 0.1 | grok-code-fast-1 | 本地代码库探索 |
| **librarian** | subagent | 0.1 | gemini-3-flash | 外部文档/SDK 研究 |
| **github-scout** | subagent | 0.1 | - | GitHub 仓库搜索 |
| **tech-scout** | subagent | 0.1 | - | 生态系统/基准分析 |
| **article-writer** | subagent | 0.1 | - | 公开技术写作 |
| **scientific-writer** | subagent | 0.1 | - | 研究面向技术写作 |
| **multimodal-looker** | subagent | 0.1 | gpt-5.3-codex medium | PDF/图片/图表分析 |
| **acceptance-reviewer** | subagent | 0.1 | - | 验收审查 |

#### 4.1.3 生物信息学智能体

| 智能体 | 职责 | 委托的内部专家 |
|--------|------|---------------|
| **bio-orchestrator** | 生信主协调器（文献→数据→计算→验证）| bio-methodologist, wet-lab-designer, paper-evidence-synthesizer |
| **bio-autopilot** | 全自主生信编排器（生信自动模式入口）| 同上 |
| **bio-planner** | 生信分析计划+实验设计 | bio-methodologist |
| **bio-methodologist** | 计算方法选择、QC、统计规划 | - |
| **bio-pipeline-operator** | 执行导向的生信 pipeline 操作 | - |
| **wet-lab-designer** | 湿实验验证计划（用户手动执行）| - |
| **paper-evidence-synthesizer** | 跨论文证据矩阵和置信度评分 | - |

#### 4.1.4 Swarm 系统（2026-04-23 已禁用）

| 智能体 | 状态 |
|--------|------|
| swarm-coordinator | 禁用 |
| swarm-worker | 禁用 |
| swarm-specialist | 禁用 |

### 4.2 智能体模式

| 模式 | 行为 |
|------|------|
| `primary` | 遵守 UI 选择的模型，作为主会话工作 |
| `subagent` | 使用自有回退链，忽略 UI 选择 |
| `all` | 两种上下文均可用 |

### 4.3 模型解析（4步）

```
1. override       → 用户配置中的 agent.model
2. category-default → 分类配置的默认模型
3. provider-fallback → 提供商回退链
4. system-default  → 系统默认模型
```

### 4.4 工具限制

| 智能体 | 限制 |
|--------|------|
| Oracle | 禁止 write, edit, task, call_omo_agent |
| Librarian | 禁止 write, edit, task, call_omo_agent |
| Explore | 禁止 write, edit, task, call_omo_agent |
| Multimodal-Looker | 只允许 read |
| Atlas | 禁止 task, call_omo_agent |
| Momus | 禁止 write, edit, task |

---

## 5. 钩子系统

### 5.1 总览：46 个钩子，5 个层级

| 层级 | 数量 | 用途 |
|------|------|------|
| Session（会话）| 24 | 会话生命周期、模型管理、自动更新、自主循环 |
| Tool-Guard（工具守卫）| 12 | 工具执行前后的校验、注入、清理 |
| Transform（变换）| 5 | 消息变换、上下文注入、思考块验证 |
| Continuation（继续执行）| 7 | Todo 继续、后台通知、不稳定智能体监控 |
| Skill（技能）| 2 | 技能提醒、自动斜杠命令 |

### 5.2 会话钩子（24个）

| 钩子名称 | 描述 |
|---------|------|
| `context-window-monitor` | 上下文窗口使用率监控，触发 L1/L2/L3 压缩 |
| `preemptive-compaction` | 预占式压缩（80% 使用率触发）|
| `session-recovery` | 会话崩溃恢复 |
| `session-notification` | 会话状态通知（输入需求、会话通知）|
| `think-mode` | 思考模式管理 |
| `model-fallback` | 模型错误时自动回退 |
| `anthropic-context-window-limit-recovery` | Anthropic 上下文窗口超限恢复 |
| `auto-update-checker` | 自动检查插件更新 |
| `agent-usage-reminder` | 智能体使用提醒 |
| `non-interactive-env` | 非交互环境适配 |
| `interactive-bash-session` | 交互式 Bash 会话管理 |
| `ralph-loop` | 自主执行循环（持续执行直到完成）|
| `edit-error-recovery` | 编辑错误恢复 |
| `delegate-task-retry` | 委派任务重试 |
| `task-resume-info` | 任务恢复信息注入 |
| `start-work` | 启动工作流（智能路由）|
| `prometheus-md-only` | Prometheus 仅 Markdown 输出 |
| `sisyphus-junior-notepad` | Sisyphus-Junior 记事本 |
| `no-sisyphus-gpt` | 禁止 Sisyphus 使用 GPT |
| `no-hephaestus-non-gpt` | 禁止 Hephaestus 使用非 GPT |
| `question-label-truncator` | 问题标签截断 |
| `compress-context` | 手动上下文压缩 |
| `anthropic-effort` | Anthropic effort 级别调节 |
| `runtime-fallback` | 运行时回退处理 |

### 5.3 工具守卫钩子（12个）

| 钩子名称 | 描述 |
|---------|------|
| `comment-checker` | AI 生成注释模式检测 |
| `tool-output-truncator` | 工具输出截断 |
| `directory-agents-injector` | 目录级 AGENTS.md 注入 |
| `directory-readme-injector` | 目录级 README 注入 |
| `empty-task-response-detector` | 空任务响应检测 |
| `rules-injector` | 规则文件注入 |
| `tasks-todowrite-disabler` | Tasks/Todowrite 工具禁用 |
| `write-existing-file-guard` | 写现有文件守卫 |
| `hashline-read-enhancer` | Hashline 读取增强 |
| `json-error-recovery` | JSON 错误恢复 |
| `read-image-resizer` | 图片读取大小调整 |
| `l0-realtime-cleanup` | L0 实时清理（上下文清理）|

### 5.4 变换钩子（5个）

| 钩子名称 | 描述 |
|---------|------|
| `claude-code-hooks` | Claude Code 兼容钩子 |
| `keyword-detector` | 关键词检测（自动触发操作）|
| `context-injector-messages-transform` | 上下文注入（消息变换）|
| `thinking-block-validator` | 思考块验证 |
| `tag-messages` | 消息标签系统（§N§）|

### 5.5 继续执行钩子（7个）

| 钩子名称 | 描述 |
|---------|------|
| `stop-continuation-guard` | 停止继续守卫 |
| `compaction-context-injector` | 压缩上下文注入 |
| `compaction-todo-preserver` | 压缩 Todo 保留 |
| `todo-continuation-enforcer` | Todo 继续执行强制器 |
| `unstable-agent-babysitter` | 不稳定智能体监控器 |
| `background-notification` | 后台任务通知 |
| `atlas` | Atlas 编排器钩子 |

### 5.6 技能钩子（2个）

| 钩子名称 | 描述 |
|---------|------|
| `category-skill-reminder` | 分类技能提醒 |
| `auto-slash-command` | 自动斜杠命令执行 |

### 5.7 ZAUC 模拟钩子（4个，仅在 zauc 模式下激活）

| 钩子名称 | 描述 |
|---------|------|
| `zauc-mocks-bg` | ZAUC 后台模拟 |
| `zauc-mocks-cache` | ZAUC 缓存模拟 |
| `zauc-mocks-hook` | ZAUC 钩子模拟 |
| `zauc-mocks-ws` | ZAUC WebSocket 模拟 |

### 5.8 钩子控制机制

- 每个钩子可通过 `disabled_hooks` 配置禁用
- `safeHookEnabled` 控制安全钩子创建（捕获异常不中断链）
- 钩子按序执行，每个钩子的异常不会阻断后续钩子

---

## 6. 工具系统

### 6.1 工具清单（26个）

#### LSP 重构工具（6个）

| 工具 | 参数 | 描述 |
|------|------|------|
| `lsp_goto_definition` | filePath, line, character | 跳转到定义 |
| `lsp_find_references` | filePath, line, character, includeDeclaration | 查找引用 |
| `lsp_symbols` | filePath, scope, query, limit | 符号搜索 |
| `lsp_diagnostics` | filePath, severity | 诊断信息 |
| `lsp_prepare_rename` | filePath, line, character | 重命名检查 |
| `lsp_rename` | filePath, line, character, newName | 符号重命名 |

#### 代码搜索工具（4个）

| 工具 | 参数 | 描述 |
|------|------|------|
| `grep` | pattern, include, path, output_mode, head_limit | 正则内容搜索（60s 超时，256KB 限制）|
| `glob` | pattern, path | 文件模式匹配（60s 超时，100 文件限制）|
| `ast_grep_search` | pattern, lang, paths, globs, context | AST 模式搜索（25种语言）|
| `ast_grep_replace` | pattern, rewrite, lang, paths, globs, dryRun | AST 模式替换 |

#### 任务管理工具（5个）

| 工具 | 参数 | 描述 |
|------|------|------|
| `task` | description, prompt, category/subagent_type, run_in_background, session_id, load_skills, command | 智能体委派/分类任务 |
| `task_create` | subject, description, blockedBy, blocks, metadata, parentID | 创建任务 |
| `task_list` | (无) | 列出任务 |
| `task_get` | id | 获取任务详情 |
| `task_update` | id, subject, description, status, addBlocks, addBlockedBy, owner, metadata | 更新任务 |

#### 后台任务工具（2个）

| 工具 | 参数 | 描述 |
|------|------|------|
| `background_output` | task_id, block, timeout, full_session, include_thinking, message_limit, since_message_id | 获取后台任务输出 |
| `background_cancel` | taskId, all | 取消后台任务 |

#### 会话管理工具（4个）

| 工具 | 参数 | 描述 |
|------|------|------|
| `session_list` | limit, from_date, to_date, project_path | 列出会话 |
| `session_read` | session_id, include_todos, include_transcript, limit | 读取会话 |
| `session_search` | query, session_id, case_sensitive, limit | 搜索会话 |
| `session_info` | session_id | 会话信息 |

#### 技能与 MCP 工具（2个）

| 工具 | 参数 | 描述 |
|------|------|------|
| `skill` | name, user_message | 加载技能/执行斜杠命令 |
| `skill_mcp` | mcp_name, tool_name/resource_name/prompt_name, arguments | 调用技能内嵌 MCP |

#### 系统工具（5个）

| 工具 | 参数 | 描述 |
|------|------|------|
| `call_omo_agent` | description, prompt, subagent_type, run_in_background, session_id | 直接调用智能体 |
| `look_at` | file_path, image_data, goal | 分析媒体文件 |
| `recall` | session_id, sections | 读取运行时工作流记忆 |
| `batch` | tool_calls[] | 批量只读操作 |
| `hashline_edit` (可选) | 精确行级编辑（需 `hashline_edit: true` 配置）|
| `image_generate` (可选) | 图片生成（需 `image_bus.enabled: true`）|

#### Magic Context 工具（4个，可选）

| 工具 | 参数 | 描述 |
|------|------|------|
| `ctx_reduce` | (上下文压缩) | 上下文精简 |
| `ctx_expand` | (上下文展开) | 上下文展开 |
| `ctx_memory` | (上下文记忆) | 跨会话持久记忆 |
| `ctx_search` | (上下文搜索) | 搜索已压缩内容 |

#### 特殊工具

| 工具 | 描述 |
|------|------|
| `interactive_bash` | Tmux 交互式终端 |

### 6.2 task() 委派分类

| 分类 | 模型 | 领域 | 努力级别 |
|------|------|------|---------|
| `visual-engineering` | gemini-3.1-pro high | 前端/UI/UX/设计 | - |
| `ultrabrain` | gpt-5.3-codex xhigh | 高难度逻辑 | xhigh |
| `deep` | gpt-5.3-codex medium | 目标导向自主求解 | medium |
| `artistry` | gemini-3.1-pro high | 创造性解决方案 | high |
| `quick` | claude-haiku-4-5 | 简单任务 | - |
| `unspecified-low` | claude-sonnet-4-6 | 低努力任务 | - |
| `unspecified-high` | gpt-5.4 | 高努力任务 | high |
| `writing` | kimi-k2p5 | 文档/写作 | - |

---

## 7. 技能系统

### 7.1 技能双形态

| 形态 | 位置 | 描述 |
|------|------|------|
| TypeScript 内置 | `src/features/builtin-skills/skills/` | 高频操作技能，实现 `BuiltinSkill` 接口 |
| 文件式技能包 | `generated/skills-bundles/` | 大型领域目录，按需从 SKILL.md 加载 |

### 7.2 技能包

| 包 | 内容 |
|------|------|
| `full` | 通用工程/写作/研究技能 |
| `paper` | 论文写作专项 |
| `bio` | 生物信息学完整目录 |

### 7.3 内置技能清单（54个）

#### 浏览器/UI/Git

| 技能 | 描述 |
|------|------|
| `playwright` | 浏览器自动化（Playwright）|
| `playwright-cli` | 浏览器自动化 CLI 版 |
| `dev-browser` | 开发浏览器交互 |
| `frontend-ui-ux` | 前端 UI/UX 开发 |
| `backend-architecture` | 后端架构设计 |
| `git-master` | Git 操作专家 |
| `git-master-sections/` | Git 子技能区段 |
| `skill-creator` | 技能创建指南 |
| `mcp-builder` | MCP 服务器构建 |
| `workflow-management` | 工作流管理 |

#### 文档/报告

| 技能 | 描述 |
|------|------|
| `docx` | DOCX 文档操作 |
| `pdf` | PDF 文档处理 |
| `pptx` | PPTX 演示文稿 |
| `xlsx` | XLSX 电子表格 |
| `doc-coauthoring` | 文档协同创作 |
| `internal-comms` | 内部沟通 |
| `brand-guidelines` | 品牌指南 |
| `document-asset-pipeline` | 文档资源管线 |
| `literature-synthesis` | 文献综合 |
| `proposal-and-roadmap` | 提案与路线图 |
| `reporting` | 报告撰写 |
| `research-paper-pipeline` | 研究论文管线 |

#### 数据分析

| 技能 | 描述 |
|------|------|
| `data-analysis` | 数据分析 |
| `web-research` | Web 研究 |

#### 生物信息学

| 技能 | 描述 |
|------|------|
| `bio-tools` | 生信工具集 |
| `bio-methods` | 生信方法学 |
| `bio-pipeline` | 生信流程 |
| `bio-visualization` | 生信可视化 |
| `blast-search` | BLAST 序列搜索 |
| `functional-annotation` | 功能注释 |
| `genome-annotation` | 基因组注释 |
| `genome-intervals` | 基因组区间操作 |
| `differential-expression` | 差异表达分析 |
| `scrna-preprocessing` | 单细胞 RNA 预处理 |
| `cell-annotation` | 细胞类型注释 |
| `atac-seq` | ATAC-seq 分析 |
| `chip-seq` | ChIP-seq 分析 |
| `metagenomics` | 宏基因组学 |
| `proteomics` | 蛋白质组学 |
| `pubmed-search` | PubMed 文献搜索 |
| `geo-query` | GEO 数据查询 |
| `sequence-analysis` | 序列分析 |
| `structural-biology` | 结构生物学 |
| `vector-design` | 载体设计 |
| `pathway-analysis` | 通路分析 |
| `read-qc` | 测序读段质量控制 |
| `read-alignment` | 读段比对 |
| `rna-quantification` | RNA 定量 |
| `variant-calling` | 变异检测 |
| `paper-evidence` | 论文证据综合 |
| `wet-lab-design` | 湿实验设计 |
| `experimental-design` | 实验设计 |

### 7.4 生物信息学技能路由规则

```
1. 加载 skill(name="research/bioinformatics")    # 根入口
2. 选择分类指南
   - research/bioinformatics/read-qc
   - research/bioinformatics/read-alignment
   - research/bioinformatics/rna-quantification
   - research/bioinformatics/pathway-analysis
   - research/bioinformatics/variant-calling
   - research/bioinformatics/genome-annotation
   - research/bioinformatics/single-cell
3. 加载最具体的叶子技能
   - research/bioinformatics/read-qc/fastp-workflow
   - research/bioinformatics/read-alignment/star-alignment
   - ...

Labforge 核心包装器: research/bioinformatics/labforge-core
```

---

## 8. MCP 系统

### 8.1 三层 MCP 架构

| 层级 | 来源 | 机制 |
|------|------|------|
| Built-in（内置）| `src/mcp/` | 内置远程 HTTP MCP |
| Claude Code | `.mcp.json` | `${VAR}` 环境变量展开 |
| Skill-embedded（技能嵌入）| SKILL.md YAML | SkillMcpManager 管理（stdio + HTTP）|

### 8.2 内置 MCP

| MCP | 状态 | 描述 |
|-----|------|------|
| `websearch` | 启用 | Exa/Tavily Web 搜索 |
| `context7` | 启用 | Context7 文档查询 |
| `grep_app` | 启用 | GitHub 代码搜索 |
| `browser_puppeteer` | 启用 | Puppeteer 浏览器自动化 |
| `chrome-devtools-mcp` | 启用 | Chrome DevTools |
| `deepwiki_mcp` | 默认关闭 | DeepWiki |
| `open_websearch_mcp` | 启用 | 开放 Web 搜索 |
| `paper_search_mcp` | 启用 | 论文搜索 |
| `semantic_scholar_fastmcp` | 启用 | Semantic Scholar |
| `zauc-mocks-mcp-index` | ZAUC 模式 | 模拟 MCP |

---

## 9. 功能模块

### 9.1 模块清单（24个目录）

| 模块 | 描述 |
|------|------|
| **background-agent** | 后台智能体管理（并发控制、模型路由）|
| **builtin-skills** | TypeScript 内置技能（54个技能文件）|
| **builtin-commands** | 内置斜杠命令 |
| **tmux-subagent** | Tmux 子会话管理 |
| **skill-mcp-manager** | 技能内嵌 MCP 生命周期管理 |
| **context-injector** | 上下文注入引擎（消息变换）|
| **model-governor** | 模型治理（自动发现+推荐）|
| **magic-context** | Magic Context 核心实现 |
| **mcp-oauth** | MCP OAuth 认证流 |
| **task-toast-manager** | Toast 通知管理 |
| **boulder-state** | Boulder 执行状态持久化 |
| **run-continuation-state** | 运行继续状态 |
| **swarm-launcher** | Swarm 启动器（已禁用）|
| **swarm-state** | Swarm 状态（已禁用）|
| **tool-metadata-store** | 工具执行元数据持久存储 |
| **hook-message-injector** | 钩子消息注入 |
| **opencode-skill-loader** | OpenCode 原生技能加载 |
| **claude-code-agent-loader** | Claude Code 智能体加载 |
| **claude-code-command-loader** | Claude Code 命令加载 |
| **claude-code-mcp-loader** | Claude Code MCP 加载 |
| **claude-code-plugin-loader** | Claude Code 插件加载 |
| **claude-code-session-state** | Claude Code 会话状态 |

---

## 10. 上下文管理

### 10.1 三级压缩系统

| 级别 | 压缩比 | 触发条件 | 操作 |
|------|--------|---------|------|
| L1 | 15-20% | 使用率 < 60%（手动） | 微修剪+指令注入 |
| L2 | 30-40% | 使用率 60-75% | 微修剪+轻量检查点 |
| L3 | 40-50% | 使用率 > 75% | 微修剪+重量检查点 |

### 10.2 按模型区分的阈值

| 模型层 | 上下文范围 | L1 阈值 | L2 阈值 | L3 阈值 |
|--------|-----------|--------|--------|--------|
| 200K 层 | 180K-350K | 110K | 140K | 150K |
| 400K 层 | 350K-900K | 150K | 220K | 300K |
| 1M 层 | 900K+ | 220K | 320K | 550K |

### 10.3 Magic Context

- 缓存感知压缩（尊重 Anthropic 提示缓存 5分钟 TTL）
- §N§ 标签系统精确定位消息
- 跨会话项目级持久记忆
- 异步后台 Historian 智能体
- `ctx_reduce`/`ctx_expand`/`ctx_memory`/`ctx_search` 工具
- TUI 实时上下文可视化

### 10.4 预占式压缩

- 在 80% 使用率触发（原 90%），提供 10% 安全缓冲
- 配置超时：120s（30s-300s 可配）
- 可选重试机制

---

## 11. 运行时工作流记忆

### 11.1 文件结构

```
.opencode/openagent-labforge/
├── bootstrap/current.json        # 仓库引导状态
├── runtime/
│   └── <session-id>/
│       ├── mission.md            # 任务声明
│       ├── roadmap.md            # 路线图
│       ├── stage/
│       │   ├── plan.md           # 计划阶段
│       │   ├── build.md          # 构建阶段
│       │   └── review.md         # 审查阶段
│       └── wave/
│           ├── wave-001-plan.md
│           ├── wave-001-build.md
│           └── wave-001-review.md
├── checkpoints/
│   ├── auto/
│   │   ├── latest.md             # 自动检查点
│   │   ├── latest.meta.json
│   │   └── history/              # 最近5个全局版本
│   ├── latest.md                 # 手动检查点
│   └── by-session/<session-id>/  # 每会话近3个版本
├── documents/                    # 文档工作区
└── paper-cache/                  # 论文缓存
```

### 11.2 检查点保留策略

| 参数 | 默认值 | 描述 |
|------|--------|------|
| `global_keep_count` | 5 | 保留最近 N 个全局版本 |
| `per_session_keep_count` | 3 | 保留每会话最近 N 个版本 |
| `session_expiry_days` | 7 | N 天后删除旧会话 |
| `auto_cleanup` | false | 是否自动清理 |

### 11.3 仓库引导系统

#### 工程引导预设

1. `product workspace` — 产品工作区
2. `library / plugin / SDK` — 库/插件/SDK
3. `backend / service / tooling` — 后端/服务/工具
4. `documentation / knowledge-base` — 文档/知识库
5. `research / prototype / spike` — 研究/原型/探索
6. `bootstrap-first scaffold` — 引导优先脚手架（推荐）
7. `let AI derive the repo posture` — 让 AI 推导仓库姿态
8. `custom project posture` — 自定义项目姿态

#### 生信引导预设

1. `mainline material pack` — 主线材料包（推荐）
2. `bio dry-lab pipeline` — 生信干实验流程
3. `literature / evidence synthesis` — 文献/证据综合
4. `bio figure / submission assets` — 生信图表/投稿素材
5. `lightweight exploratory proof` — 轻量探索性验证
6. `bootstrap-first bio scaffold` — 生信引导优先脚手架
7. `let AI derive the repo posture` — 让 AI 推导
8. `custom project posture` — 自定义

---

## 12. 自主执行模式

### 12.1 工程自主模式

| 入口 | mode | style | 行为 |
|------|------|-------|------|
| `wase` | light | batch | 紧凑审查批次，不强制过度积压 |
| `wase` | heavy | continuous | 多波次执行，推动积压扩展和审查路由 |

### 12.2 生物信息学自主模式

| 入口 | mode | style | 行为 |
|------|------|-------|------|
| `bio-autopilot` | light | batch | 紧凑批次 |
| `bio-autopilot` | heavy | continuous | 多波次完整工作流 |

### 12.3 light vs heavy 分类信号

- 计划大小信号：活跃计划文件中的检查清单/任务量
- 计划路径/内容语义信号：关键词如 migration、architecture、integration、validation、pipeline、bioinformatics
- 用户请求文本信号：多个重度范围信号更可能分类为 `heavy`

### 12.4 自主执行原则

- "首次主要输入 + 系统驱动继续" 原则
- 用户主要任务意图主要在第一个提示中
- 后续波次主要由系统引导、自动审查和继续驱动
- 批次模式在审查通过后干净停止
- 完成声明中如果包含具体的"下一波次/下一步"工作，视为伪完成并推回执行

---

## 13. 斜杠命令

### 13.1 执行控制命令

| 命令 | 描述 |
|------|------|
| `/ol-start-work` | 启动工作会话（智能域路由）|
| `/ol-stop-continuation` | 停止当前会话的所有继续机制 |
| `/ol-todo-clear` | 清除过期的 todo 和执行残留 |
| `/ol-workflow-reset` | 重置当前会话的执行工作流状态 |
| `/ol-focus-chat` | 返回普通聊天模式 |
| `/ol-ralph-loop` | 启动自主执行循环 |
| `/ol-ulw-loop` | 启动 ultrawork 循环 |
| `/ol-cancel-ralph` | 取消活跃的 Ralph 循环 |

### 13.2 上下文管理命令

| 命令 | 描述 |
|------|------|
| `/ol-compress` | 手动触发上下文压缩（auto/light/medium/heavy/preemptive）|
| `/ol-compression-stats` | 查看压缩历史和统计 |
| `/ol-compress-context` | L1/L2/L3 压缩堆栈检查/触发 |
| `/ol-checkpoint` | 创建仓库本地检查点（light/heavy）|
| `/ol-checkpoint-resume` | 从最新或指定检查点恢复 |
| `/ol-handoff` | 创建上下文延续摘要用于新会话 |

### 13.3 代码质量命令

| 命令 | 描述 |
|------|------|
| `/ol-refactor` | 智能重构（LSP+AST-grep+架构分析+TDD 验证）|
| `/ol-remove-ai-slops` | 移除 AI 生成代码异味并审查 |

### 13.4 设置命令

| 命令 | 描述 |
|------|------|
| `/ol-settings` | 打开原生 TUI 设置界面 |
| `/ol-settings-image-bus` | 打开图片总线设置子页面 |
| `/ol-init-deep` | 初始化分层 AGENTS.md 知识库 |

---

## 14. 配置系统

### 14.1 配置层级

```
项目 (.opencode/openagent-labforge.jsonc)
  → 用户 (~/.config/opencode/openagent-labforge.jsonc)
  → 默认值 (Zod safeParse 填充)
```

### 14.2 合并策略

| 字段 | 策略 |
|------|------|
| `agents`, `categories`, `claude_code` | 递归深度合并 |
| `disabled_*` (agents/hooks/mcps/skills/commands/tools) | Set 并集 |
| 其他字段 | 覆盖替换 |
| 缺失字段 | Zod safeParse() 填充默认值 |

### 14.3 可配置字段（28个顶层字段）

`$schema`, `new_task_system_enabled`, `default_run_agent`, `disabled_mcps`, `disabled_agents`, `disabled_skills`, `disabled_hooks`, `disabled_commands`, `disabled_tools`, `hashline_edit`, `agents`, `categories`, `claude_code`, `sisyphus_agent`, `comment_checker`, `experimental`, `auto_update`, `skills`, `ralph_loop`, `background_task`, `notification`, `babysitting`, `git_master`, `browser_automation_engine`, `websearch`, `tmux`, `sisyphus`, `start_work`, `model_selection`, `model_fallback`, `runtime_fallback`, `image_bus`, `soul`, `mcp_policy`, `i18n`

### 14.4 智能体覆盖字段（21个）

`model`, `variant`, `category`, `skills`, `temperature`, `top_p`, `prompt`, `prompt_append`, `tools`, `disable`, `description`, `mode`, `color`, `permission`, `maxTokens`, `thinking`, `reasoningEffort`, `textVerbosity`, `providerOptions`

---

## 15. 图片总线（Image Bus）

### 15.1 状态

- 配置门控（`image_bus.enabled: true`）
- 默认关闭
- 未配置后端时保持 SVG-first 回退行为

### 15.2 计划目标

- Google Nano Banana 风格后端
- ComfyUI 兼容后端
- 可选生成图片主模型审查

### 15.3 配置示例

```jsonc
{
  "image_bus": {
    "enabled": true,
    "context_memory": {
      "enabled": true,
      "carry_prompt_context": true,
      "max_history_turns": 5,
      "include_provider_decision_trace": false
    },
    "providers": {
      "google_nano_banana": {
        "enabled": true,
        "base_url": "https://relay.example.com",
        "generate_endpoint": "/proxy/google/{model}/images",
        "api_key_env": "GOOGLE_API_KEY",
        "model": "nano-banana-2"
      }
    }
  }
}
```

---

## 16. 测试策略

### 16.1 测试框架

- **运行时**: Bun (`bun:test`)
- **模式**: co-located `*.test.ts` 文件
- **风格**: given/when/then（嵌套 describe，`#given`/`#when`/`#then` 前缀）

### 16.2 CI 测试分割

- Mock-heavy 测试：隔离运行（独立 `bun test` 进程）
- 其余：批量运行
- test-setup.ts 通过 bunfig.toml 预加载

### 16.3 测试命令

```bash
bun test                    # 运行测试套件
bun run typecheck           # tsc --noEmit
```

---

## 17. CI/CD

| 工作流 | 触发 | 用途 |
|--------|------|------|
| `ci.yml` | push/PR → master/dev | 测试（分割）、类型检查、构建、schema 自动提交 |
| `publish.yml` | 手动 dispatch | 版本提升、npm 发布、平台二进制、GitHub release |
| `publish-platform.yml` | 由 publish 调用 | 12个平台二进制（bun compile） |
| `sisyphus-agent.yml` | @mention / dispatch | AI 智能体处理 issues/PRs |
| `cla.yml` | issue_comment/PR | CLA 助手 |
| `lint-workflows.yml` | push → .github/ | actionlint + shellcheck |

---

## 18. 技术规范

### 18.1 开发规范

| 规范 | 要求 |
|------|------|
| 运行时 | Bun only |
| TypeScript | strict mode, ESNext, bundler moduleResolution |
| 类型定义 | `bun-types`（禁止 `@types/node`）|
| 文件命名 | kebab-case |
| 模块结构 | index.ts barrel exports，禁止 catch-all 文件 |
| 文件大小 | 200 LOC 软限制（提示词内容除外）|
| 导入 | 模块内相对导入，模块间 barrel 导入 |
| 工厂模式 | `createXXX()` 用于所有工具、钩子、智能体 |
| 路径别名 | 禁止 `@/`，仅相对导入 |
| 测试风格 | given/when/then（禁止 Arrange-Act-Assert）|

### 18.2 反模式

| 禁止项 | 说明 |
|--------|------|
| `as any`, `@ts-ignore`, `@ts-expect-error` | 绝对禁止 |
| 抑制 lint/type 错误 | 绝对禁止 |
| 自动提交 | 除非用户明确要求 |
| `bun publish` | 必须使用 GitHub Actions |
| 本地修改 package.json version | 禁止 |
| catch-all 文件 | 禁止 utils.ts/helpers.ts/service.ts |
| 空 catch 块 | 必须处理错误 |
| index.ts 放业务逻辑 | 仅入口点和重新导出 |

### 18.3 模型回退优先级

```
Claude > OpenAI > Gemini > Copilot > OpenCode Zen > Z.ai > Kimi
```

### 18.4 推荐模型

- **DeepSeek V4-Pro**: 主编排器、复杂推理（$0.28-0.30/百万 token，1M 上下文）
- **DeepSeek V4-Flash**: 子智能体、研究、代码探索（约 V4-Pro 价格的 1/3，1M 上下文）

---

## 19. 关键依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `@opencode-ai/plugin` | ^1.2.16 | OpenCode 插件 SDK |
| `@opencode-ai/sdk` | ^1.2.17 | OpenCode 客户端 SDK |
| `opencode-ai` | ^1.14.25 | OpenCode 核心运行时 |
| `@ast-grep/napi` | ^0.40.0 | AST 模式搜索 |
| `zod` | ^4.1.8 | 配置验证 |
| `commander` | ^14.0.2 | CLI 框架 |
| `jsonc-parser` | ^3.3.1 | JSONC 解析 |
| `js-yaml` | ^4.1.1 | YAML 解析 |
| `@modelcontextprotocol/sdk` | ^1.25.2 | MCP 协议 |
| `@code-yeongyu/comment-checker` | ^0.7.0 | AI 注释检测 |
| `picocolors` | ^1.1.1 | 终端颜色 |
| `picomatch` | ^4.0.2 | glob 匹配 |
| `diff` | ^8.0.3 | 文件差异 |
| `jszip` | ^3.10.1 | ZIP 处理 |

---

## 20. 文档索引

| 文档 | 路径 |
|------|------|
| 安装指南 | `docs/guide/installation.md` |
| 编排指南 | `docs/guide/orchestration.md` |
| 子智能体编排 | `docs/guide/subagent-orchestration.md` |
| 生信技能 | `docs/guide/bio-skills.md` |
| 生信论文自主流 | `docs/guide/bio-paper-autonomous-flow-v1.md` |
| 配置参考 | `docs/reference/configuration.md` |
| 功能参考 | `docs/reference/features.md` |
| 上游迁移审计 | `docs/release/upstream-oh-my-openagent-3.11-plus-audit.md` |
| Apache 2.0 重构计划 | `REFACTOR_APACHE2_PLAN.md` |
| Magic Context 文档 | `MAGIC_CONTEXT.md` |
| 上下文守卫实现 | `CONTEXT_GUARD_IMPLEMENTATION.md` |

---

> **最后更新**: 2026-04-27 | **版本**: 3.15.2 | **分支**: dev
