# Agent 命名变更记录

## 变更日期：2026-04-21

## 变更原因
1. **去神话化**：希腊神话名称（Sisyphus, Prometheus, Atlas, Hephaestus）虽有文化内涵，但对新用户不够直观
2. **职能化**：使用功能性名称，让用户一眼看出 agent 的职责
3. **一致性**：统一命名规则，避免混淆（如"智能调度"vs"智能编排"）
4. **简单化**：生信用户可能专业性不够，需要更简单直观的命名

## 命名对照表

### 核心 Agent（用户可见）

| Agent Key | 旧英文名 | 新英文名 | 旧中文名 | 新中文名 | 显示模式 |
|-----------|---------|---------|---------|---------|---------|
| `sisyphus` | Sisyphus (Ultraworker) | **Task Dispatcher** | 智能调度 | **任务调度器** | minimal, standard |
| `prometheus` | Prometheus (Plan Builder) | **Task Planner** | 任务规划 | **任务规划器** | minimal, standard |
| `atlas` | Atlas (Plan Executor) | **Plan Executor** | 计划执行 | **计划执行器** | minimal, standard |
| `wase` | WASE (Autonomous Ultrawork) | **Auto Executor** | 全自动执行 | **自动执行器** | minimal, standard |
| `hephaestus` | Hephaestus (Deep Agent) | **Deep Executor** | 深度开发 | **深度执行器** | standard |
| `orchestrator` | Orchestrator (Smart Brain) | **Smart Router** | 智能编排 | **智能路由器** | minimal, standard |

### 生信 Agent（用户可见）

| Agent Key | 旧英文名 | 新英文名 | 旧中文名 | 新中文名 | 显示模式 |
|-----------|---------|---------|---------|---------|---------|
| `bio-autopilot` | Bio-Autopilot (Autonomous Bio) | **Bio Auto Executor** | 生信全自动 | **生信自动执行器** | minimal, standard |
| `bio-pipeline-operator` | bio-pipeline-operator | **Bio Executor** | 生信流程 | **生信执行器** | standard |

### 内部 Agent（用户不直接看到，但会通过 Ctrl+O 查看）

| Agent Key | 旧英文名 | 新英文名 | 旧中文名 | 新中文名 |
|-----------|---------|---------|---------|---------|
| `bio-orchestrator` | bio-orchestrator | **Bio Coordinator** | 生信编排 | **生信协调器** |
| `engineering-orchestrator` | engineering-orchestrator | **Eng Coordinator** | 工程编排 | **工程协调器** |
| `bio-planner` | bio-planner | **Bio Planner** | 生信规划 | **生信规划器** |
| `bio-methodologist` | bio-methodologist | **Bio Methodologist** | 生信方法 | **生信方法学家** |
| `wet-lab-designer` | wet-lab-designer | **Wet-Lab Designer** | 实验设计 | **湿实验设计师** |
| `paper-evidence-synthesizer` | paper-evidence-synthesizer | **Paper Synthesizer** | 文献整合 | **文献综合器** |
| `multimodal-looker` | multimodal-looker | **Multimodal Analyzer** | 图文分析 | **多模态分析器** |

### 工程专家 Agent（内部）

| Agent Key | 旧英文名 | 新英文名 | 旧中文名 | 新中文名 |
|-----------|---------|---------|---------|---------|
| `oracle` | oracle | **Architect** | 架构咨询 | **架构师** |
| `librarian` | librarian | **Doc Expert** | 文档查询 | **文档专家** |
| `explore` | explore | **Code Explorer** | 代码探索 | **代码探索器** |
| `metis` | Metis (Plan Consultant) | **Plan Advisor** | 规划顾问 | **规划顾问** |
| `momus` | Momus (Plan Critic) | **Plan Critic** | 计划审查 | **计划审查** |

## 命名规则

### 1. 后缀统一
- **Dispatcher** (调度器): 分发任务
- **Router** (路由器): 智能路由
- **Coordinator** (协调器): 协调多个专家
- **Planner** (规划器): 制定计划
- **Executor** (执行器): 执行任务
- **Expert** (专家): 提供专业能力
- **Analyzer** (分析器): 分析数据
- **Synthesizer** (综合器): 综合信息

### 2. 前缀说明
- **Task**: 通用任务相关
- **Plan**: 计划相关
- **Auto**: 自动化
- **Deep**: 深度/复杂
- **Smart**: 智能
- **Bio**: 生物信息学
- **Eng**: 工程

### 3. 避免的词汇
- ❌ "智能" (太泛泛，多个 agent 都用)
- ❌ "编排" (orchestrator 容易混淆)
- ❌ 希腊神话名称 (不直观)
- ❌ 缩写词 (WASE 不清楚含义)

## 用户体验改进

### 改进前
```
用户看到: "Sisyphus (Ultraworker)" 
疑问: Sisyphus 是什么？Ultraworker 是干什么的？

用户看到: "智能调度" vs "智能编排"
疑问: 这两个有什么区别？
```

### 改进后
```
用户看到: "Task Dispatcher" / "任务调度器"
理解: 负责分发任务的

用户看到: "Smart Router" / "智能路由器"
理解: 负责智能路由的，和调度器不同
```

## 向后兼容

- ✅ Agent Key 未改变（sisyphus, prometheus, atlas 等保持不变）
- ✅ 配置文件无需修改
- ✅ 代码引用无需修改
- ✅ 只改变了显示名称（用户界面）

## 影响范围

### 已修改文件
- ✅ `src/shared/agent-display-names.ts` - 显示名称映射

### 需要更新的文档
- ⏳ `README.md` - 更新 agent 介绍
- ⏳ `docs/guide/COMPLETE_CONFIGURATION_GUIDE.md` - 更新配置说明
- ⏳ `docs/AGENT_NAMING_PROPOSAL.md` - 标记为已实施

### 不需要修改
- ✅ 所有 agent 定义文件（src/agents/*.ts）- 只是显示名，不影响逻辑
- ✅ 配置文件（openagent-labforge.json）- 使用 agent key，不是显示名
- ✅ 工具调用（call_omo_agent, delegate_task）- 使用 agent key

## 测试清单

- [ ] 启动应用，检查 TUI 中的 agent 名称显示
- [ ] 使用 `/help` 命令，检查 agent 列表
- [ ] 调用各个 agent，检查工作正常
- [ ] 使用 Ctrl+O 查看内部 agent，检查名称显示
- [ ] 切换中英文语言，检查两种语言的显示名
- [ ] 检查日志中的 agent 名称

## 用户通知

建议在下一个版本的 Release Notes 中说明：

```markdown
## 🎨 Agent 命名优化

为了提升用户体验，我们对所有 agent 的显示名称进行了优化：

- **去神话化**: 移除希腊神话名称，使用功能性名称
- **更直观**: 一眼看出 agent 的职责
- **更一致**: 统一命名规则，避免混淆

主要变更：
- Sisyphus → Task Dispatcher (任务调度器)
- Prometheus → Task Planner (任务规划器)
- Atlas → Plan Executor (计划执行器)
- Orchestrator → Smart Router (智能路由器)
- 等等...

**注意**: 这只是显示名称的变更，配置文件和代码无需修改。
```

## 未来优化方向

1. **考虑改 Agent Key**: 如果要彻底去神话化，可以考虑：
   - `sisyphus` → `dispatcher`
   - `prometheus` → `planner`
   - `atlas` → `executor`
   - 但这需要大量的代码和配置迁移

2. **简化内部 agent 名称**: 
   - `bio-pipeline-operator` → `bio-executor` (已在显示名中体现)
   - `paper-evidence-synthesizer` → `paper-synthesizer` (已在显示名中体现)

3. **增加 agent 描述**: 在 TUI 中显示 agent 时，增加一行简短描述
