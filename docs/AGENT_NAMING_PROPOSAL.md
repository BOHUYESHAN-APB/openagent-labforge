# OpenAgent Labforge - Agent 命名优化方案

## 当前架构概览

### 显示模式
- **minimal** (精简版): 5-6个agent，最佳用户体验
- **standard** (标准版): 8个agent，包含更多专业工具

### 领域开关
- **bioinformatics**: 生物信息学领域
- **engineering**: 软件工程领域

---

## 当前所有 Agent 清单

### 核心调度层 (Core Orchestration)
| Agent Key | 英文显示名 | 中文显示名 | 职责 | 显示模式 |
|-----------|-----------|-----------|------|---------|
| `sisyphus` | Sisyphus (Ultraworker) | 智能调度 | 主调度器，任务分发和专家协调 | minimal, standard |
| `wase` | WASE (Autonomous Ultrawork) | 全自动执行 | 通用全自动执行 | minimal, standard |
| `hephaestus` | Hephaestus (Deep Agent) | 深度开发 | 深度执行和复杂任务 | standard |
| `atlas` | Atlas (Plan Executor) | 计划执行 | 轻量级计划执行 | minimal, standard |

### 规划层 (Planning)
| Agent Key | 英文显示名 | 中文显示名 | 职责 | 显示模式 |
|-----------|-----------|-----------|------|---------|
| `prometheus` | Prometheus (Plan Builder) | 任务规划 | 规划师，创建执行计划 | minimal, standard |
| `bio-planner` | bio-planner | 生信规划 | 生信分析规划专家 | 内部调用 |

### 智能编排层 (Intelligent Orchestration)
| Agent Key | 英文显示名 | 中文显示名 | 职责 | 显示模式 |
|-----------|-----------|-----------|------|---------|
| `orchestrator` | Orchestrator (Smart Brain) | 智能编排 | 智能路由，检测任务类型并分发 | minimal, standard |
| `bio-orchestrator` | bio-orchestrator | 生信编排 | 生信任务协调器 | 内部调用 |
| `engineering-orchestrator` | engineering-orchestrator | 工程编排 | 工程任务协调器 | 内部调用 |

### 生信领域专家 (Bioinformatics Specialists)
| Agent Key | 英文显示名 | 中文显示名 | 职责 | 显示模式 |
|-----------|-----------|-----------|------|---------|
| `bio-autopilot` | Bio-Autopilot (Autonomous Bio) | 生信全自动 | 生信全自动执行 | minimal, standard (领域开关) |
| `bio-pipeline-operator` | bio-pipeline-operator | 生信流程 | 生信流程执行 | standard |
| `bio-methodologist` | bio-methodologist | 生信方法 | 方法学和统计设计 | 内部调用 |
| `wet-lab-designer` | wet-lab-designer | 实验设计 | 湿实验设计 | 内部调用 |
| `paper-evidence-synthesizer` | paper-evidence-synthesizer | 文献整合 | 文献证据综合 | 内部调用 |
| `multimodal-looker` | multimodal-looker | 图文分析 | PDF、图表分析 | 内部调用 |

### 工程领域专家 (Engineering Specialists)
| Agent Key | 英文显示名 | 中文显示名 | 职责 | 显示模式 |
|-----------|-----------|-----------|------|---------|
| `oracle` | oracle | 架构咨询 | 架构咨询和设计决策 | 内部调用 |
| `librarian` | librarian | 文档查询 | 库文档和API参考 | 内部调用 |
| `explore` | explore | 代码探索 | 代码库探索 | 内部调用 |
| `metis` | Metis (Plan Consultant) | 规划顾问 | 规划咨询 | 内部调用 |
| `momus` | Momus (Plan Critic) | 计划审查 | 代码审查和质量评估 | 内部调用 |

### 其他专家 (Other Specialists)
| Agent Key | 英文显示名 | 中文显示名 | 职责 | 显示模式 |
|-----------|-----------|-----------|------|---------|
| `github-scout` | GitHub-Scout | GitHub 搜索 | GitHub搜索 | 内部调用 |
| `tech-scout` | Tech-Scout | 技术调研 | 技术调研 | 内部调用 |
| `article-writer` | article-writer | 文章写作 | 文章写作 | 内部调用 |
| `scientific-writer` | scientific-writer | 科研写作 | 科研写作 | 内部调用 |
| `acceptance-reviewer` | acceptance-reviewer | 验收审查 | 验收审查 | 内部调用 |

---

## 问题分析

### 当前命名混淆点

1. **sisyphus (智能调度) vs orchestrator (智能编排)**
   - 两者都有"智能"，职责边界不清晰
   - sisyphus 是主调度器，orchestrator 是智能路由器
   - 用户难以区分何时用哪个

2. **orchestrator vs bio-orchestrator vs engineering-orchestrator**
   - orchestrator 实际是"智能路由器"（检测任务类型并分发）
   - bio-orchestrator 和 engineering-orchestrator 是"专业协调器"（协调多个专家）
   - 三者都叫 orchestrator，但职责不同

3. **prometheus (任务规划) vs bio-planner (生信规划)**
   - 都是规划，但层次不同
   - prometheus 是通用规划师（可以智能路由到bio-planner能力）
   - bio-planner 是生信专业规划师

4. **wase (全自动执行) vs bio-autopilot (生信全自动)**
   - 都是"全自动"，但领域不同
   - 命名上没有体现领域差异

---

## 命名优化方案

### 方案 A：按职责层次重命名（推荐）

#### 核心理念
- **Dispatcher/Router**: 任务分发和路由（决定"谁来做"）
- **Coordinator**: 多专家协调（协调"怎么做"）
- **Planner**: 计划制定（规划"做什么"）
- **Executor**: 执行器（执行"具体任务"）
- **Specialist**: 专家（提供"专业能力"）

#### 具体命名

| 原 Key | 新 Key (建议) | 英文显示名 | 中文显示名 | 职责说明 |
|--------|--------------|-----------|-----------|---------|
| **核心调度层** |
| `sisyphus` | `sisyphus` | Sisyphus (Master Dispatcher) | 西西弗斯 (主调度器) | 保持不变，强调"主调度"角色 |
| `wase` | `wase` | WASE (Auto Executor) | WASE (自动执行器) | 保持不变，强调"执行"而非"全自动" |
| `hephaestus` | `hephaestus` | Hephaestus (Deep Executor) | 赫菲斯托斯 (深度执行器) | 保持不变，强调"深度执行" |
| `atlas` | `atlas` | Atlas (Plan Executor) | 阿特拉斯 (计划执行器) | 保持不变 |
| **规划层** |
| `prometheus` | `prometheus` | Prometheus (Master Planner) | 普罗米修斯 (主规划师) | 保持不变，强调"主规划"角色 |
| `bio-planner` | `bio-planner` | Bio Planner (Specialist) | 生信规划专家 | 保持不变，明确是"专家"级别 |
| **智能路由和协调层** |
| `orchestrator` | `task-router` | Task Router (Smart Brain) | 任务路由器 (智能大脑) | 改名强调"路由"职责 |
| `bio-orchestrator` | `bio-coordinator` | Bio Coordinator | 生信协调器 | 改名强调"协调"职责 |
| `engineering-orchestrator` | `eng-coordinator` | Engineering Coordinator | 工程协调器 | 改名强调"协调"职责 |
| **生信专家** |
| `bio-autopilot` | `bio-autopilot` | Bio Autopilot (Auto Executor) | 生信自动驾驶 (自动执行器) | 保持不变，强调"执行"角色 |
| `bio-pipeline-operator` | `bio-executor` | Bio Executor (Pipeline) | 生信执行器 (流程) | 简化命名，强调"执行"职责 |
| `bio-methodologist` | `bio-methodologist` | Bio Methodologist | 生信方法学家 | 保持不变 |
| `wet-lab-designer` | `wet-lab-designer` | Wet-Lab Designer | 湿实验设计师 | 保持不变 |
| `paper-evidence-synthesizer` | `paper-synthesizer` | Paper Synthesizer | 文献综合器 | 简化命名 |
| `multimodal-looker` | `multimodal-looker` | Multimodal Looker | 多模态分析器 | 保持不变 |
| **工程专家** |
| `oracle` | `oracle` | Oracle (Architect) | 神谕 (架构师) | 保持不变 |
| `librarian` | `librarian` | Librarian (Doc Expert) | 图书管理员 (文档专家) | 保持不变 |
| `explore` | `explore` | Explorer (Code Scout) | 探索者 (代码侦察) | 保持不变 |
| `metis` | `metis` | Metis (Plan Advisor) | 墨提斯 (规划顾问) | 保持不变 |
| `momus` | `momus` | Momus (Code Critic) | 摩摩斯 (代码评论家) | 保持不变 |

---

### 方案 B：中文优化（面向中文用户）

| 原 Key | 新 Key | 英文显示名 | 中文显示名 | 说明 |
|--------|--------|-----------|-----------|------|
| `sisyphus` | `master-dispatcher` | Master Dispatcher | 主调度器 | 直白表达职责 |
| `orchestrator` | `smart-router` | Smart Router | 智能路由器 | 强调路由职责 |
| `bio-orchestrator` | `bio-coordinator` | Bio Coordinator | 生信协调器 | 强调协调职责 |
| `engineering-orchestrator` | `eng-coordinator` | Engineering Coordinator | 工程协调器 | 强调协调职责 |
| `prometheus` | `master-planner` | Master Planner | 主规划师 | 强调主规划角色 |
| `bio-planner` | `bio-planner` | Bio Planner | 生信规划师 | 保持不变 |
| `wase` | `auto-executor` | Auto Executor | 自动执行器 | 强调执行职责 |
| `bio-autopilot` | `bio-auto-executor` | Bio Auto Executor | 生信自动执行器 | 强调领域和执行 |

---

### 方案 C：最小改动（保守方案）

只改动最混淆的部分，其他保持不变：

| 原 Key | 新中文显示名 | 说明 |
|--------|------------|------|
| `sisyphus` | 主调度器 | 从"智能调度"改为"主调度器" |
| `orchestrator` | 智能路由器 | 从"智能编排"改为"智能路由器" |
| `bio-orchestrator` | 生信协调器 | 从"生信编排"改为"生信协调器" |
| `engineering-orchestrator` | 工程协调器 | 从"工程编排"改为"工程协调器" |
| `prometheus` | 主规划师 | 从"任务规划"改为"主规划师" |
| `bio-planner` | 生信规划师 | 从"生信规划"改为"生信规划师" |

---

## 用户视角的 Agent 层次结构

### Minimal 模式（精简版）- 用户可见
```
主调度层:
  ├─ sisyphus (主调度器) - 总指挥，分发任务
  └─ wase (自动执行器) - 全自动完成任务

智能路由层:
  └─ task-router (任务路由器) - 智能识别任务类型并路由

规划层:
  └─ prometheus (主规划师) - 创建执行计划

执行层:
  └─ atlas (计划执行器) - 执行计划

生信领域 (可选):
  └─ bio-autopilot (生信自动驾驶) - 生信全自动
```

### Standard 模式（标准版）- 用户可见
```
主调度层:
  ├─ sisyphus (主调度器)
  └─ wase (自动执行器)

智能路由层:
  └─ task-router (任务路由器)

规划层:
  └─ prometheus (主规划师)

执行层:
  ├─ atlas (计划执行器) - 轻量级
  ├─ hephaestus (深度执行器) - 深度开发
  └─ bio-executor (生信执行器) - 生信流程

生信领域 (可选):
  └─ bio-autopilot (生信自动驾驶)
```

### 内部专家层（用户不直接看到）
```
生信协调器:
  └─ bio-coordinator (由 task-router 内部调用)
      ├─ bio-methodologist (方法学家)
      ├─ wet-lab-designer (实验设计师)
      ├─ paper-synthesizer (文献综合器)
      └─ multimodal-looker (多模态分析器)

工程协调器:
  └─ eng-coordinator (由 task-router 内部调用)
      ├─ oracle (架构师)
      ├─ librarian (文档专家)
      ├─ explore (代码探索者)
      ├─ metis (规划顾问)
      └─ momus (代码评论家)

规划专家:
  └─ bio-planner (由 prometheus 内部调用)
```

---

## 命名原则总结

### 清晰的职责分层
1. **Dispatcher/Router** (调度器/路由器): 决定任务由谁处理
2. **Coordinator** (协调器): 协调多个专家完成复杂任务
3. **Planner** (规划师): 制定执行计划
4. **Executor** (执行器): 执行具体任务
5. **Specialist** (专家): 提供专业领域能力

### 命名一致性
- 主层级用 Master (主调度器、主规划师)
- 路由用 Router (任务路由器)
- 协调用 Coordinator (生信协调器、工程协调器)
- 执行用 Executor (自动执行器、深度执行器、生信执行器)
- 专家用 Specialist/Expert 或具体职能名

### 避免混淆
- 不要多个agent都用"智能"
- 不要多个agent都用"编排"
- 同类agent用统一后缀 (如都用 Coordinator)

---

## 推荐实施方案

**推荐采用方案 A + 方案 C 的混合方案：**

### 立即改动（解决最大混淆）
1. `orchestrator` → 中文改为 "智能路由器" (英文保持 "Orchestrator (Smart Brain)")
2. `bio-orchestrator` → 中文改为 "生信协调器"
3. `engineering-orchestrator` → 中文改为 "工程协调器"
4. `sisyphus` → 中文改为 "主调度器"
5. `prometheus` → 中文改为 "主规划师"

### 后续优化（可选，需要更多测试）
1. 考虑将 `orchestrator` 重命名为 `task-router`
2. 考虑将 `bio-orchestrator` 重命名为 `bio-coordinator`
3. 考虑将 `engineering-orchestrator` 重命名为 `eng-coordinator`
4. 考虑将 `bio-pipeline-operator` 重命名为 `bio-executor`

---

## 需要讨论的问题

1. **是否改动 agent key？**
   - 改动 key 需要更新配置、代码引用、文档
   - 只改显示名更安全，但不够彻底

2. **英文显示名是否也要改？**
   - 目前方案主要改中文显示名
   - 英文用户是否也会混淆？

3. **希腊神话命名是否保留？**
   - sisyphus, prometheus, atlas, hephaestus 等
   - 有文化内涵，但对新用户不够直观

4. **minimal vs standard 的边界是否合理？**
   - 当前 minimal 只有 5-6 个
   - 是否需要调整？

5. **生信领域是否需要更多用户可见的 agent？**
   - 当前只有 bio-autopilot 和 bio-executor (standard)
   - 是否需要暴露更多专家？
