# OpenAgent Labforge

OpenAgent Labforge 是一个面向 OpenCode 的插件分支，当前聚焦三件事：

- 更强的工程化编排能力
- 更明确、可检查的子会话委派
- 以生物信息学为核心的专用工作流

它衍生自 `code-yeongyu/oh-my-openagent`，并保留上游的许可与来源边界。
详见 [LICENSE.md](LICENSE.md)、[NOTICE](NOTICE)、
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 与
[docs/licensing.md](docs/licensing.md)。

## 这个分支现在是什么

这份 README 只描述当前实际行为，不再保留旧路线图式的叙述。

当前插件的核心定位是：

- 以 `task(subagent_type=...)` 为规范委派路径
- 面向新版 OpenCode 的稳定 plugin / agent / MCP 注入
- 将搜索、文档、代码、论文检索明确拆层
- 建设第一方生信 agent 与 skills 体系
- 将长期任务运行时记忆统一沉淀到 `.opencode/openagent-labforge/`
- 继续坚持本地优先安装与开发

## 协议与版权策略（重构过渡期）

从提交 `2d1addad32aeaec7381bd5502977393000bcc27a` 起，本仓库新增代码按以下规则管理：

- 新增原创代码版权归 OpenAgent Labforge 维护方/贡献者所有。
- 新增原创代码采用 Apache-2.0 许可证。
- 历史上游衍生代码在被重构替换前，仍按其来源许可边界管理。

本仓库已启动全量重构计划，目标是在重构完成后，将后续代码主干统一到 Apache-2.0。
计划文档见 [REFACTOR_APACHE2_PLAN.md](REFACTOR_APACHE2_PLAN.md)。

## 当前模型推荐

**🌟 强烈推荐：DeepSeek V4（性价比之王）**

DeepSeek V4 系列模型以无与伦比的价格提供卓越性能：

- **DeepSeek V4-Pro**：T0 级性能（媲美 GPT-5.4/Claude Opus 4.6）
  - 价格：$0.28-0.30/M tokens（比竞品便宜 20-50 倍）
  - 上下文：1M tokens
  - 适用场景：主 agent、复杂推理、编排任务
  
- **DeepSeek V4-Flash**：T1 级性能（足以应对大多数任务）
  - 价格：约为 V4-Pro 的 1/3
  - 上下文：1M tokens
  - 适用场景：子 agent、研究、代码探索

**为什么选择 DeepSeek V4？**
- 🚀 T0 级推理能力，价格却是零头
- 💰 所有用户都能负担（经常有促销活动）
- 🎯 本插件包含优化的提示词
- 📊 1M 上下文窗口，适合大型代码库

**配置方式**：使用内置 TUI 设置（`/ol-settings` → 模型选择设置）将 DeepSeek 配置为所有 agent 的首选模型。

### 其他推荐模型

当前项目对手动模型选择的建议是：

- **同样强烈推荐：**
  - GPT 系列（GPT-5.4、GPT-4o）
  - GLM 系列
  - Kimi 系列
  
- **推荐：**
  - Google / Gemini 系列
  
- **支持但未在最新测试周期完全验证：**
  - Claude 系列（注意：部分用户倾向避免此提供商）

Gemini 说明：

- 在这个分支当前的长上下文提示词和工具路由方式下，Gemini 在提示词特别长时，偶尔更容易在中英混合用户场景里输出非用户目标语言，或者出现语言漂移

## 上下文窗口建议

**⚠️ 重要：Context Guard 系统 v2.0 现已可用**

本插件现在包含针对不同模型上下文大小优化的高级多层上下文保护系统。详见 [Context Guard 实现指南](./CONTEXT_GUARD_IMPLEMENTATION.md)（[中文版](./CONTEXT_GUARD_IMPLEMENTATION_ZH.md)）。

### 快速开始

**200K 模型（Claude Haiku 等）**：使用 `balanced` 预设
**256K 模型（Kimi 等）**：使用 `balanced-plus` 预设  
**400K+ 模型**：使用 `balanced` 或 `aggressive` 预设

在 `.opencode/openagent-labforge.jsonc` 中配置：
```jsonc
{
  "experimental": {
    "context_guard_profile": "balanced",  // 或 "balanced-plus" 用于 256K
    "preemptive_compaction": true
  }
}
```

访问设置：输入 `/ol-settings` → 运行时设置 → Context Guard 设置

### 上下文窗口层级

插件会根据模型上下文自动调整压缩阈值：

- **200K 层级**（180K-350K）：针对 200K 和 256K 模型优化
  - Balanced 预设：L1@110K, L2@140K, L3@150K
  - 避免 150K+ 问题（1/3 的 200K 模型在 150K 后有问题）
  - Plus 预设为 256K 模型增加 30K 余量
  
- **400K 层级**（350K-900K）：针对 400K 模型
  - Balanced 预设：L1@150K, L2@220K, L3@300K
  
- **1M 层级**（900K+）：针对 1M+ 模型（包括 DeepSeek V4）
  - Balanced 预设：L1@220K, L2@320K, L3@550K
  - **DeepSeek V4 注意**：V4-Pro 和 V4-Flash 都有 1M 上下文，使用 balanced 预设效果极佳

### 模型特定上下文建议

**DeepSeek V4（1M 上下文）：**
- 使用 `balanced` 或 `aggressive` 预设
- 上下文利用效率极佳
- 可以轻松处理大型代码库
- 推荐用于长时间会话

**GPT-5.4 及类似模型（400K+）：**
- 使用 `balanced` 预设
- 在所有上下文范围内表现强劲

**Gemini（因提供商而异）：**
- 检查提供商的实际上下文限制
- 某些提供商变体暴露的上下文少于宣传值
- 256K 变体使用 `balanced-plus`

### 传统建议（v2.0 之前）

为了获得更稳定的结果，优先选择**稳定支持大于 400K 上下文**的模型。

建议：

- 超过 400K 的上下文模型，通常明显优于短上下文模型
- 实际有效工作上下文尽量保持在 500K 到 550K 左右
- 不要默认把上下文推到宣传上限
- 真正需要长时间自动执行、生物信息学长会话、或深度工程会话时，尽量使用 **大于 500K** 的上下文模型

### 强烈实践建议

对于严肃的自主使用，特别是：

- `wase`
- `bio-autopilot`
- `bio-orchestrator`
- 长时间工程会话
- 长时间生物信息学会话

尽可能优先使用**超过 500K 有效上下文**的模型。

**🌟 DeepSeek V4 是这些用例的理想选择**，拥有 1M 上下文窗口和卓越性能。

实践规则：

- 低于 ~400K：深度自主会话需谨慎使用
- ~500K 及以上：强烈推荐
- ~1M 及以上：长时间 auto / bio 会话的最佳体验（DeepSeek V4 属于此类）

为什么这很重要：

- 模型自己就可能生成很长的 summary
- 两次 compaction 之间的真实工作轮次有时会非常短
- 同一个模型家族在不同服务商下，上下文上限可能完全不同

示例：

- 某些 Gemini 提供商变体暴露的上下文可能远少于模型家族建议值
- 不要假设提供商 A 和提供商 B 为同一模型名提供相同的实际上下文窗口

## 当前核心能力

### 工程编排层

- `sisyphus`：主调度器
- `wase`：全自动调度器
- `hephaestus`：深度编码执行者
- `prometheus`：规划器
- `atlas`：执行协调器
- `metis`：规划前分析
- `momus`：计划审查

这些核心 agent 正在统一接入更强的工程能力：

- 更严格的范围控制
- 更强的验证要求
- 更清晰的规划和审查标准
- 更可执行的委派契约

当前工程能力接入分层：

- 强执行 + 强编排：`sisyphus`、`wase`
- 强执行：`hephaestus`
- 强编排：`atlas`
- 强规划：`prometheus`、`metis`
- 强审查：`momus`

这样分层是刻意的，后面如果 OpenCode 官方补上同类能力，我们更容易按块去重。

### 运行时工作流记忆

长期任务现在统一锚定在：

- `.opencode/openagent-labforge/`

当前运行时工作流结构包括：

- repo-local runtime state
- `mission.md`
- `roadmap.md`
- 阶段文件：
  - `plan.md`
  - `build.md`
  - `review.md`
- 波次文件：
  - `wave-001-plan.md`
  - `wave-001-build.md`
  - `wave-001-review.md`
- 文档工作区
### Magic Context - 缓存感知的上下文管理

OpenAgent LabForge 包含受 [Magic Context](https://github.com/cortexkit/opencode-magic-context) 启发的高级上下文管理：

- **缓存感知压缩**：遵守 Anthropic 的提示缓存 TTL（默认 5 分钟）
- **标签系统**：使用 §N§ 标签精确引用消息
- **跨会话记忆**：项目范围的持久化知识
- **后台压缩**：异步 Historian agent
- **Agent 工具**：ctx_reduce、ctx_expand、ctx_memory、ctx_search
- **TUI 可视化**：实时上下文分解

详见 [MAGIC_CONTEXT.md](MAGIC_CONTEXT.md)。

在配置中启用：
```jsonc
{
  "experimental": {
    "magic_context": {
      "enabled": true,
      "cache_ttl": "5m",
      "async_compression": true
    }
  }
}
```

### 自动执行模式

自动模式现在区分两个层级和两种交互风格：

- 两套 auto 模式入口：
  - 工程全自动：`wase`
  - 生物信息学全自动：`bio-autopilot`

- 层级：
  - `light`
  - `heavy`
- 交互风格：
  - `batch`
  - `continuous`

当前行为大致是：

- `light + batch`：适合较紧凑的一批一批执行，不强行扩成过大的 backlog
- `heavy + continuous`：适合更长时间、多波次的持续推进，会更积极地触发 backlog 扩展、审查打回和继续执行
- `heavy` 且处于 `plan` 阶段时，会先触发一次明确的规划引导：先走一次 planning task（例如 `task(subagent_type="prometheus", ...)`），再进入多 task / 多 agent 执行
- `/ol-start-work` 执行器选择遵循“auto 显式优先”规则：
  - 已处于 auto 会话，或用户在请求中明确表达全自动意图时，自动切到 `wase`（工程）或 `bio-autopilot`（生信）
  - 仅有 heavy 信号但用户并未表达 auto 意图时，不会强制切到全自动，仍走普通执行器路径（优先 `atlas`，回退 `sisyphus`）
- auto 设计原则是“首条主输入 + 系统自驱”：
  - 用户主要输入集中在第一条任务描述
  - 后续以系统引导、auto review 与继续执行为主；用户仅在发现偏差时再追加指导
  - 在 auto 会话里，若规划阶段已通过审查且尚未进入 tracked 执行，系统会自动完成一次 start-work 等价引导，让全自动执行器接管后续波次
- `batch` 自动模式在 reviewed wave 被批准后，现在会干净停下，而不是默认继续滚到下一波
- 已批准波次遗留的旧 todo，在用户开启新一轮时会优先按 stale 处理，不再轻易“回魂”
- 如果模型一边说“这轮完成了”，一边又列出当前范围内明确的“下一步 / 下一波”工作，系统会把它识别为伪完成，并打回重建下一轮执行波次

这些模式信息会被写入 repo-local 的 runtime workflow state。

`light` / `heavy` 判定来源（不是只看一项）：

- 计划文件规模信号：如 checklist 数量（较大的多任务计划更容易进 `heavy`）
- 计划路径与正文语义信号：例如 migration、architecture、integration、validation、pipeline、bioinformatics 等关键词
- 用户请求文本信号：`/ol-start-work` 当前请求会参与判定；用户提示词中若出现多个重任务语义信号，会提高判定为 `heavy` 的概率

可简化理解为：

- 轻任务、短波次、低复杂度描述，通常判定 `light + batch`
- 多阶段、多子系统、长链路执行描述，通常判定 `heavy + continuous`

### 新仓库 bootstrap 引导

现在，当用户在两个 auto 模式里进入一个看起来仍处于初始化阶段、并且已经接入 git 的仓库时，插件可以先问一个“这个仓库要按什么工程姿态起步”的问题，再开始真正的大规模执行。

这个 bootstrap 触发条件是刻意收紧的：

- 仅限两个 auto 模式
- 仅限会话首轮
- 仅限 git-backed 且仍然很早期的仓库
- 如果用户首句已经明确说了技术体系，就不再追问
- 如果当前会话是 fork / resume / checkpoint 接力，且已经有工程姿态状态，也不会重复追问

选定后的工程姿态会写到：

- `.opencode/openagent-labforge/bootstrap/current.json`

后续会作为一个很轻量的常驻提示继续注入，而不是每轮重新问。

当前工程 bootstrap 预设：

1. `产品工作台仓`
2. `库 / 插件 / SDK 仓`
3. `后端 / 服务 / 工具链仓`
4. `文档 / 知识库仓`
5. `研究 / 原型 / Spike 仓`
6. `工程骨架优先（推荐）`
7. `让 AI 自行设计工程姿态`
8. `自定义工程姿态`

当前生信 bootstrap 预设：

1. `综合主线材料包（推荐）`
2. `干实验流程仓`
3. `文献 / 证据综合仓`
4. `图件 / 投稿资产仓`
5. `轻量探索 / 证明型仓`
6. `清爽工程骨架优先`
7. `让 AI 自行设计工程姿态`
8. `自定义工程姿态`

首轮 bootstrap 回答示例：

- `6`
- `1,4`
- `7`
- `8: 这个仓库按插件-SDK 主线起步，公开说明写 README，深层设计说明留在私有工作区`

如果用户选择“让 AI 自行设计工程姿态”，插件希望 auto agent 按固定量表来推导，而不是自由发挥：

- 仓库主类型
- 主交付物
- 执行节奏
- 产物组织方式
- 验证强度
- 用户参与强度
- 默认提问策略

### 会话清理命令

现在内置了一组用于清理旧执行残留的斜杠命令：

- `/ol-stop-continuation`
- `/ol-todo-clear`
- `/ol-workflow-reset`
- `/ol-focus-chat`

原生 TUI 设置入口命令：

- `/ol-settings`
- `/ol-settings-image-bus`

它们的实际用途是：

- `/ol-stop-continuation`：停止当前会话的 continuation 机制
- `/ol-todo-clear`：清掉旧 todo 和当前 session 的执行残留
- `/ol-workflow-reset`：清掉当前 session / project 绑定的 workflow 状态，方便重新开始
- `/ol-focus-chat`：把当前会话拉回普通问答模式，压住旧执行状态继续干扰
- `/ol-settings`：直接打开插件自己的原生 TUI 设置面
- `/ol-settings-image-bus`：直接打开同一套 TUI 设置里的 image_bus 二级页面
- image_bus 页面负责：
  - API 服务商与模型
  - 普通绘图 / 科研绘图路由
  - 中转 / 代理 `generate_endpoint`
  - 上下文记忆 `context_memory`

补充说明：

- 这两个设置命令不再通过 chat template / 提示词注入实现。
- 在 TUI 里，插件现在会注册自己的原生命令与 slash 入口。
- 如果用户手打 raw `/ol-settings` 消息，插件会做兜底拦截，避免把命令文本直接喂给模型。

作用域说明：

- 上述 `/` 命令主要面向 OpenCode TUI 的 slash / command UI
- 不是 PowerShell 命令，不能在终端直接执行

这组命令存在的原因很现实：

- 旧 todo
- 旧自动执行状态
- 旧 workflow 记忆

如果不处理，后续普通问答很容易被旧状态拖重或误导。

这些命令尤其适合在下面几种情况后使用：

- 自动模式切回普通问答
- 旧 todo / 旧 batch 状态继续干扰当前会话
- 长会话或长审查波次之后需要明显收口

### 上下文压缩优化

**v2.1 新增**：上下文压缩系统已大幅增强，压缩率提升、版本管理完善、用户控制增强。

#### 压缩效果提升

| 级别 | 优化前 | 优化后 | 提升幅度 |
|------|--------|--------|---------|
| L1 | 5-10% | 15-20% | +100% |
| L2 | 15-25% | 30-40% | +60% |
| L3 | 30-40% | 40-50% | +25% |

#### 新增功能

- **L1 压缩指令**：L1 现在会注入轻量模型指令（之前没有）
- **Checkpoint 版本管理**：保留最近 5 个全局版本和 3 个会话版本
- **提前触发 Preemptive**：从 90% 提前到 80% 使用率（10% 安全缓冲）
- **压缩历史记录**：追踪最近 50 次压缩事件及压缩率
- **手动压缩命令**：`/ol-compress` 和 `/ol-compression-stats`

#### 配置选项

在 `.opencode/openagent-labforge.jsonc` 中添加：

```jsonc
{
  "experimental": {
    "context_compression": {
      "micro_prune_threshold": 500,           // 工具输出压缩阈值（100-5000）
      "enable_duplicate_detection": true,     // 检测重复内容
      "enable_error_stack_compression": true  // 压缩长错误堆栈
    },
    "checkpoint_retention": {
      "global_keep_count": 5,          // 保留最近 N 个全局 checkpoint
      "per_session_keep_count": 3,     // 保留最近 N 个会话 checkpoint
      "session_expiry_days": 7,        // 删除 N 天前的旧会话
      "auto_cleanup": false            // 启用自动清理
    },
    "preemptive_compaction_config": {
      "buffer_ratio": 0.10,      // L3 前的安全缓冲（1%-20%）
      "timeout_ms": 120000,      // 压缩超时时间（30s-300s）
      "retry_on_failure": false  // 压缩失败时重试
    }
  }
}
```

#### 手动压缩命令

**`/ol-compress [level]`** - 手动触发上下文压缩

参数：
- `auto`（默认）：根据使用率自动选择级别
  - 使用率 < 60%：应用 L1（micro-prune + 指令）
  - 使用率 60-75%：应用 L2（micro-prune + light checkpoint）
  - 使用率 > 75%：应用 L3（micro-prune + heavy checkpoint）
- `light` / `l1`：强制 L1 压缩
- `medium` / `l2`：强制 L2 压缩
- `heavy` / `l3`：强制 L3 压缩
- `preemptive`：触发原生 session.summarize()

别名：`/compress`

**`/ol-compression-stats [filter]`** - 查看压缩历史和统计

参数：
- 无参数：显示完整统计
- `l1` / `l2` / `l3`：按压缩级别过滤
- `recent`：只显示最近 10 条事件

别名：`/compression-stats`

输出示例：
```
Compression Statistics for Session abc123
================================================

Current State:
- Carried Tokens: 550000 / 1000000 (55%)
- Current Level: L3
- Last Updated: 2026-04-22T12:00:00Z

Compression History (26 events):

By Level:
- L1: 15 events, avg compression: 6.8%
- L2: 8 events, avg compression: 12.9%
- L3: 3 events, avg compression: 14.5%

By Action:
- Micro-prune: 15 events
- Checkpoint: 11 events
- Preemptive: 0 events

Total Tokens Removed: 285000
Time Range: 2026-04-22T10:00:00Z to 2026-04-22T12:00:00Z

Recent Events (last 5):
1. [2026-04-22T12:00:00Z] L3 checkpoint: removed 80000 tokens (14.5%)
2. [2026-04-22T11:30:00Z] L2 checkpoint: removed 60000 tokens (13.2%)
...
```

#### Checkpoint 版本管理

Checkpoint 文件现在支持版本化和滚动保留：

```
.opencode/openagent-labforge/checkpoints/auto/
├── latest.md                    # 最新版本（向后兼容）
├── latest.meta.json
├── history/
│   ├── checkpoint-001.md        # 全局历史（保留最近 5 个）
│   ├── checkpoint-002.md
│   └── checkpoint-005.md
└── by-session/
    └── <session-id>/
        ├── checkpoint-001.md    # 会话历史（保留最近 3 个）
        └── checkpoint-003.md
```

优势：
- 可以回退到之前的 checkpoint 版本
- 自动清理防止磁盘爆满
- 会话过期自动删除 N 天前的旧会话

### Checkpoint 接力命令

现在也内置了一组面向长任务接力的 checkpoint 命令，用来避免把同一个会话无限拉长。

当前 checkpoint 命令：

- `/ol-handoff`
- `/ol-compress-context`
- `/ol-checkpoint`
- `/ol-checkpoint-resume`

它们的用途是：

- `/ol-handoff`：生成一份可直接复制到新会话里的上下文摘要
- `/ol-compress-context`：管理当前会话的运行时压缩，而不是做人类交接用 checkpoint
  - `status`：查看当前压缩状态
  - `auto`：自动选择压缩层级
  - `l1`：请求原生 OpenCode 风格 summarize / compaction，并只展示简短摘要
  - `l2`：加强 repo-local 的同会话运行时记忆
  - `l3`：准备重型跨会话 checkpoint，但不会自动切会话
- `/ol-checkpoint`：显式写入 repo-local checkpoint，路径位于
  `.opencode/openagent-labforge/checkpoints/`
  - `light`（默认）：用于同会话恢复或短接力
  - `heavy`：用于跨会话高保真接力
- `/ol-checkpoint-resume`：在新会话或当前会话中读取最近一次 checkpoint，并重建下一轮执行计划

这几个命令的边界现在明确是：

- `/ol-compress-context`：运行时压缩和上下文治理
- `/ol-checkpoint`：显式、可审阅、可交接的耐久 handoff
- `/ol-compress-context` 可能会刷新
  `.opencode/openagent-labforge/checkpoints/auto/`
  下的 auto checkpoint，但它不等同于用户显式执行 `/ol-checkpoint`
- `/ol-compress-context` 与 `/ol-checkpoint` 会复用一部分 checkpoint 落盘逻辑，
  用来减少重复代码；但两者语义仍然分离：
  - auto checkpoint（`checkpoints/auto/`）：压缩流程的运行时恢复产物
  - explicit checkpoint（`checkpoints/latest.md`、`checkpoints/by-session/*`）：
    面向人工审阅和明确交接的耐久产物
- `/ol-checkpoint-resume` 可同时恢复两类文件，优先 explicit checkpoint，
  不存在时再回退到 auto checkpoint

压缩层级目前是：

- `L1`：原生 summarize 请求 + 可见短摘要，不把压缩后的正文直接展示给用户。
  目标：让上下文窗口压力真实下降。
- `L2`：把本地 runtime memory 补强到 repo-local 文件，比如
  `context-capsule.md`、`context-pressure.json`。
  目标：压缩后工程执行能力不掉。
- `L3`：准备更适合跨会话续接的 heavy checkpoint；推荐新会话，但不自动切换。
  目标：长任务交接可持续。

checkpoint 层级目前是：

- `light`：同会话恢复、短接力、压缩后的防漂移锚点
- `heavy`：当前会话已过重、出现卡顿或已接近可持续上限时的跨会话接力锚点

会话切换策略：

- 压缩/写 checkpoint 与切会话是两件事，默认分离。
- 自动 L3 可以自动准备 heavy 产物，但切会话应保持用户确认。
- 手动 `/ol-compress-context l3` 视为用户已明确要求重型准备，准备阶段不再二次确认。
- 当上下文债务和 UI 卡顿已经影响执行质量时，应优先写 heavy checkpoint，
  然后用 `/ol-checkpoint-resume` 在新会话续跑。

现在 checkpoint 不只是带一段摘要，还会带一小份结构化工程姿态：

- artifact policy
- 当前活跃 work item
- bootstrap / repo posture

这样新的接力会话可以恢复：

- 输出应该继续写到哪里
- 当前仓库是按材料包、骨架仓、文档仓还是别的姿态在运行
- fresh repo 阶段选定的工程体系是什么

而不需要重新读整段旧会话或重新扫整个输出目录树。

这组命令的定位，是作为插件侧 fallback：

- 对旧版 OpenCode
- 对 UI 不稳定或长会话容易卡顿的环境
- 对还没有原生 checkpoint 工作流的场景

都可以先靠这套 repo-local checkpoint 机制完成跨会话接力。

### 专长 agent

- `explore`：本地代码发现
- `librarian`：单一库 / SDK / 框架研究
- `github-scout`：仓库侦察与选型
- `tech-scout`：生态、benchmark、发布分析
- `article-writer`：公众技术写作
- `scientific-writer`：科研 / 同行向技术写作
- `multimodal-looker`：PDF / 图片 / 图表理解

### Multimodal-Looker 的定义与边界

核心目的：

- 最大化对图片、图表、截图、文档嵌图的语义理解能力
- 给主 agent 返回“提取后的结论”，而不是把主会话拖进重多模态解析
- 通过子会话隔离复杂视觉上下文，降低主会话压力

主要输入路径：

- `look_at(file_path=..., goal=...)`：本地单文件多模态解析
- `look_at(file_path=<目录>, goal=...)`：目录多图批量解析
- `look_at(file_path=<docx/pptx>, goal=...)`：文档内嵌图片解包后语义解析

边界（它不负责的事情）：

- 不替代普通文本/代码的逐字读取流程
- 不承担文档编辑器角色
- 不是独立的图像生成后端

调度规则：

- 任务目标是图像语义（图表含义、截图解释、插图位置建议）时，优先路由到 `multimodal-looker`
- 任务目标是字面文本/代码提取时，优先 `read` 与仓库证据工具

### 生物信息学体系

当前已经形成明确的生信层级：

- 主入口：
  `bio-orchestrator` 负责综合协调
  `bio-pipeline-operator` 负责执行型任务
- 内部专家：
  `bio-methodologist` 负责计算设计、QC、统计规划
  `wet-lab-designer` 负责用户执行的湿实验验证设计
  `paper-evidence-synthesizer` 负责跨论文证据矩阵与置信度分层

这套体系不只是“泛泛做分析”，还包括：

- 文献检索
- 公共数据集发现
- 计算分析
- 为用户设计湿实验验证方案
- 证据整合
- 专业报告输出

## 内置 Skills 方向

当前内置 skill 已经覆盖通用工程和生信两条线。

通用方向：

- `playwright`
- `frontend-ui-ux`
- `backend-architecture`
- `git-master`
- `skill-creator`
- `mcp-builder`
- `docx-workbench`
- `pdf-toolkit`
- `pptx-studio`
- `proposal-and-roadmap`
- `doc-coauthoring`
- `internal-comms`
- `brand-guidelines`
- `document-asset-pipeline`
- `literature-synthesis`
- `xlsx-analyst`

生信方向：

- `bio-tools`
- `blast-search`
- `functional-annotation`
- `bio-methods`
- `wet-lab-design`
- `bio-pipeline`
- `paper-evidence`
- `differential-expression`
- `scrna-preprocessing`
- `cell-annotation`
- `atac-seq`
- `chip-seq`
- `metagenomics`
- `proteomics`
- `pubmed-search`
- `geo-query`
- `sequence-analysis`
- `structural-biology`
- `bio-visualization`
- `vector-design`

这些生信 skill 都不是泛泛提示词，而是面向执行的技能说明，写明了：

- 推荐工具
- 常见命令或代码路径
- 预期产物
- 适用边界

新增的通用 skill 主要用于补强：

- skill 设计与复用
- MCP Server 设计与评估
- 长文档协作
- 内部沟通写作
- 跨页面 / 文档 / 幻灯片的一致品牌表达

现在生信 agent 也带了明确的数据交互与环境安全能力：

- 缺关键数据时会主动向用户索要“决定性输入”，而不是泛泛说“请提供数据”
- 会区分必需输入和可选补充材料
- Python 环境优先 `uv`
- 混合原生工具栈优先 `conda`
- 在 Windows 下会明确指出哪些场景实际上需要 WSL / Linux

### 文档与论文工作区行为

现在，文档类 skills 在加载时会自动在 runtime workflow 根目录下创建 repo-local 工作区。

当前行为包括：

- 文档类 writing / document skills 会创建 document workspace
- 文献 / 论文类 skills 会创建 paper cache
- 记录 asset / output / revision manifest
- 必要时为文档源工作区初始化子 git 仓库
- 文档工作区现在还能区分 audience / tracking / publish target

这套机制是 source-first 的：

- 真正持续维护的是源文档和 manifest
- 二进制输出仍然视为生成产物

当前配图策略：

- 现阶段优先走 SVG
- 当任务需要插图、但图像总线后端没有配置时，先插入 SVG 占位图或 SVG 派生图
- 后续用户可以自行替换为正式生成图或手工优化后的图

当前文档工作区的路由规则是：

- 面向开源读者、应写进主仓库的文档，可以走 `repo-docs`
  例如：
  - `README.md`
  - `docs/<name>.md`
- 设计文档、内部说明、私有用户交付、定制文案等，默认应留在
  `.opencode/openagent-labforge/runtime/.../documents/`
  下的 repo-local 工作区，而不是直接落到主仓库公开树里
- 文档类 skills 现在可以显式带这些参数：
  - `audience=public-reader|internal|end-user`
  - `tracking=repo-tracked|workspace-git|ephemeral`
  - `publish_target=repo-docs|workspace-private`
  - `target_path=README.md|docs/<name>.md`

## 当前 MCP 集合

内置 MCP 已经主动收口。

保留并可见的内置 MCP：

- `websearch`
- `context7`
- `grep_app`
- `browser_puppeteer`
- `chrome-devtools-mcp`
- `deepwiki_mcp`（默认关闭）
- `open_websearch_mcp`
- `paper_search_mcp`
- `semantic_scholar_fastmcp`

已移除出内置可见集合：

- `arxiv_mcp`
- `fetch_browser`

原因很简单：

- 避免重复能力
- 缩小 MCP 表面面积
- `deepwiki_mcp` 改为用户按需开启，而不是默认打开

## OpenCode 兼容迁移

近期迁移重点是跟上新版 OpenCode 的行为。

已对齐或强化的部分包括：

- canonical + legacy 插件配置发现
- builtin agent 保护与运行时注册
- command 发现链：
  - `.opencode/command`
  - `.opencode/commands`
  - 向上发现直到 worktree 根
  - slash 风格嵌套命令名
- `.agents/skills` 注入链
- MCP 合并顺序与用户覆盖行为
- todo continuation / compaction / stagnation 保护链
- 半自动会话收口：
  普通主会话不会再轻易被旧 todo / workflow 状态拖回自动续跑
- 运行时 agent 名称统一：
  delegation / background / recovery / continuation 统一使用 OpenCode 真正可识别的显示名，而不是内部 key

上游迁移审计清单见：

- [docs/release/upstream-oh-my-openagent-3.11-plus-audit.md](docs/release/upstream-oh-my-openagent-3.11-plus-audit.md)

## 推荐搭配插件

OpenAgent Labforge 强烈建议和下面两个插件搭配使用：

- `opencode-pty`
- `@tarquinen/opencode-dcp`

它们不是硬依赖，但对本地实际工作流帮助很大。

## 安装

### 快速开始（全平台）

**重要：OpenCode 从本地 `node_modules` 加载插件，而不是从全局 npm 安装！**

```bash
# 步骤 1：克隆并构建
git clone https://github.com/BOHUYESHAN-APB/openagent-labforge.git
cd openagent-labforge
bun install
bun run build
npm pack

# 步骤 2：安装到 OpenCode 配置目录
# Linux/macOS:
cd ~/.config/opencode
# Windows:
cd C:\Users\<你的用户名>\.config\opencode

npm install /path/to/openagent-labforge/bohuyeshan-openagent-labforge-core-<version>.tgz

# 步骤 3：验证安装
ls node_modules/@bohuyeshan/openagent-labforge-core  # 应该存在

# 步骤 4：配置 OpenCode
# 编辑 ~/.config/opencode/ 中的两个配置文件：
# - opencode.json（服务端插件）
# - tui.json（TUI 插件）

# opencode.json:
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core@<version>",
    "opencode-pty@0.3.2"
  ]
}

# tui.json:
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core@<version>"
  ]
}

# 步骤 5：完全重启 OpenCode
```

**关键要点：**
- ✅ 安装到 `~/.config/opencode/node_modules`（本地安装）
- ❌ 不要使用 `npm install -g`（全局安装不起作用）
- ✅ 同时更新 `opencode.json` 和 `tui.json`
- ✅ 使用带版本号的包名：`@bohuyeshan/openagent-labforge-core@3.15.2`

**配置目录位置：**
- Linux: `~/.config/opencode`
- macOS: `~/.config/opencode`
- Windows: `C:\Users\<你的用户名>\.config\opencode`

详细安装说明、故障排查和配置选项，请参见：

- [docs/guide/installation.md](docs/guide/installation.md)

### TUI 设置入口（统一，终端模式）

如果你在本仓库开发环境里测试 CLI，请使用：

```bash
bun run src/cli/index.ts settings
```

兼容旧入口（仍支持）：

```bash
bun run src/cli/index.ts configure
```

当前图像总线设置入口：

```bash
bun run src/cli/index.ts settings --image-bus
```

常用检查命令：

```bash
bun run src/cli/index.ts settings --help
bun run src/cli/index.ts configure --help
```

Google 中转/代理端点配置示例：

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

`generate_endpoint` 同时支持：

- 相对路径（会与 `base_url` 组合）
- 完整 URL（直接使用）

并支持 `{model}` 占位符替换。

`context_memory` 用于控制图像生成相关上下文在多轮对话中的携带策略。

### OpenCode 自动安装提示词

如果你想让 OpenCode 自己克隆、构建并安装此插件，可以将此提示词粘贴到新的 OpenCode 会话中：

```text
请在本地克隆 https://github.com/BOHUYESHAN-APB/openagent-labforge.git，然后构建并安装到 OpenCode 配置目录（不是全局 npm）。

要求：
1. 使用 Bun 构建（不要用 npm 或 yarn）
2. 运行：bun install && bun run build && npm pack
3. 安装到 OpenCode 配置目录：
   - Windows: cd %USERPROFILE%\.config\opencode
   - Linux/macOS: cd ~/.config/opencode
   - 然后运行：npm install /path/to/openagent-labforge/bohuyeshan-openagent-labforge-core-*.tgz
4. 同时更新 opencode.json 和 tui.json 使用包名：
    "@bohuyeshan/openagent-labforge-core@<version>"
   （不要用 file:/// 路径 - 它们无法正常工作）
5. 删除此插件的任何旧 file:/// 条目
6. 保留其他现有插件
7. 显示给我：
    - 克隆路径
    - 执行的构建命令
    - OpenCode 目录内安装验证（npm list @bohuyeshan/openagent-labforge-core）
    - opencode.json 与 tui.json 的最终 plugin 数组
    - 确认需要重启 OpenCode

如果缺少 Bun，请先告诉我如何安装。
```

如果你只是想清掉旧会话里的残留状态，而不是重新安装插件：

- 用 `/ol-focus-chat` 把当前会话切回普通问答
- 如果残留还比较重，再用 `/ol-workflow-reset`

## 本地参考仓

迁移和设计所需的参考仓统一放在 `Future/` 下。

当前包括：

- 上游 `oh-my-openagent`
- `BioClaw`
- `Geneclaw`
- `codex-main`

这些只是本地参考目录，不属于最终分发物。

## 当前优先级

当前工作顺序是：

1. 收完上游 OpenCode 兼容特性迁移
2. 强化核心 agent 的工程能力
3. 继续优化生物信息学 agent 与 skills

## 暂列后续项

下面两块目前明确还是后续项，不把它们伪装成已经彻底完成：

- GLM / Kimi / DeepSeek 等更多模型家族的专用 prompt 适配
- 完整图像执行总线

当前图像总线立场：

- 只在配置存在并启用时才参与工作流
- 默认不开启
- 如果没有配置任何后端，当前文档工作流就保持 SVG-first，而不是假装图像生成已经可用

后续准备适配的图像总线目标包括：

- Google Nano Banana 一类后端
- ComfyUI 兼容后端
- 生成图片后再交给主模型复审的可选链路

图像生成功能接入状态（当前）：

- 已列入后续里程碑
- 正在收集各平台 API 接入需求与参数结构
- 在外部 API 合同稳定前，插件默认继续保持 SVG-first 回退策略

## 协作说明

维护者说明：

- 多人协作场景下的 Git 合并有时会花更久
- 维护者本人并不擅长复杂的多人 Git 冲突处理
- 某些贡献合并阶段，可能会依赖 AI 先参与审阅、整理和辅助合并

## 故障排查

### TUI 滚动条不可见

如果安装插件后 TUI 中看不到垂直滚动条：

1. **自动修复**：插件现在会在首次安装时自动启用滚动条（v1.15.0+）
2. **手动切换**：按 `Ctrl+K` 打开命令面板，然后搜索 "Toggle session scrollbar"
3. **持久化设置**：滚动条设置存储在 `~/.local/state/opencode/kv.json` 中的 `scrollbar_visible` 字段

注意：OpenCode 的默认行为是隐藏滚动条。此插件默认启用它以提供更好的用户体验。

## 文档入口

- [docs/guide/installation.md](docs/guide/installation.md)
- [docs/guide/orchestration.md](docs/guide/orchestration.md)
- [docs/guide/subagent-orchestration.md](docs/guide/subagent-orchestration.md)
- [docs/guide/subagent-orchestration.zh-cn.md](docs/guide/subagent-orchestration.zh-cn.md)
- [docs/guide/bio-skills.md](docs/guide/bio-skills.md)
- [docs/guide/bio-paper-autonomous-flow-v1.md](docs/guide/bio-paper-autonomous-flow-v1.md)
- [docs/reference/configuration.md](docs/reference/configuration.md)
- [docs/reference/features.md](docs/reference/features.md)

## 其他语言

- [English](README.md)
- [简体中文](README.zh-cn.md)
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [Русский](README.ru.md)
