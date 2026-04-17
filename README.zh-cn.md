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

当前项目对手动模型选择的建议是：

- 强烈推荐：
  - GPT 系列
  - GLM 系列
  - Kimi 系列
- 推荐：
  - Google / Gemini
- 当前适配也不错：
  - DeepSeek 系列
- 仍然支持，但这一轮本地验证还没有完全覆盖：
  - Claude 系列

Gemini 说明：

- 在这个分支当前的长上下文提示词和工具路由方式下，Gemini 在提示词特别长时，偶尔更容易在中英混合用户场景里输出非用户目标语言，或者出现语言漂移

## 上下文窗口建议

为了获得更稳定的结果，优先选择**稳定支持大于 400K 上下文**的模型。

建议：

- 超过 400K 的上下文模型，通常明显优于短上下文模型
- 实际有效工作上下文尽量保持在 500K 到 550K 左右
- 不要默认把上下文推到宣传上限
- 真正需要长时间自动执行、生物信息学长会话、或深度工程会话时，尽量使用 **大于 500K** 的上下文模型
- 如果能稳定提供 **1M 以上上下文**，体验通常最好

这很重要，因为：

- 模型自己就可能生成很长的 summary
- 两次 compaction 之间的真实工作轮次有时会非常短
- 同一个模型家族在不同服务商下，上下文上限可能完全不同

实践上不要只看模型名，要看提供商的真实上下文上限。

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
- 论文缓存

这样做的目的，是让长任务在 compaction 后仍然可持续推进，同时避免把临时状态散落到多个顶层目录里。

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
- `/start-work` 执行器选择遵循“auto 显式优先”规则：
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
- 用户请求文本信号：`/start-work` 当前请求会参与判定；用户提示词中若出现多个重任务语义信号，会提高判定为 `heavy` 的概率

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

- `/stop-continuation`
- `/todo-clear`
- `/workflow-reset`
- `/focus-chat`

它们的实际用途是：

- `/stop-continuation`：停止当前会话的 continuation 机制
- `/todo-clear`：清掉旧 todo 和当前 session 的执行残留
- `/workflow-reset`：清掉当前 session / project 绑定的 workflow 状态，方便重新开始
- `/focus-chat`：把当前会话拉回普通问答模式，压住旧执行状态继续干扰

这组命令存在的原因很现实：

- 旧 todo
- 旧自动执行状态
- 旧 workflow 记忆

如果不处理，后续普通问答很容易被旧状态拖重或误导。

这些命令尤其适合在下面几种情况后使用：

- 自动模式切回普通问答
- 旧 todo / 旧 batch 状态继续干扰当前会话
- 长会话或长审查波次之后需要明显收口

### Checkpoint 接力命令

现在也内置了一组面向长任务接力的 checkpoint 命令，用来避免把同一个会话无限拉长。

当前 checkpoint 命令：

- `/handoff`
- `/compress-context`
- `/checkpoint`
- `/checkpoint-resume`

它们的用途是：

- `/handoff`：生成一份可直接复制到新会话里的上下文摘要
- `/compress-context`：管理当前会话的运行时压缩，而不是做人类交接用 checkpoint
  - `status`：查看当前压缩状态
  - `auto`：自动选择压缩层级
  - `l1`：请求原生 OpenCode 风格 summarize / compaction，并只展示简短摘要
  - `l2`：加强 repo-local 的同会话运行时记忆
  - `l3`：准备重型跨会话 checkpoint，但不会自动切会话
- `/checkpoint`：显式写入 repo-local checkpoint，路径位于
  `.opencode/openagent-labforge/checkpoints/`
  - `light`（默认）：用于同会话恢复或短接力
  - `heavy`：用于跨会话高保真接力
- `/checkpoint-resume`：在新会话或当前会话中读取最近一次 checkpoint，并重建下一轮执行计划

这几个命令的边界现在明确是：

- `/compress-context`：运行时压缩和上下文治理
- `/checkpoint`：显式、可审阅、可交接的耐久 handoff
- `/compress-context` 可能会刷新
  `.opencode/openagent-labforge/checkpoints/auto/`
  下的 auto checkpoint，但它不等同于用户显式执行 `/checkpoint`
- `/compress-context` 与 `/checkpoint` 会复用一部分 checkpoint 落盘逻辑，
  用来减少重复代码；但两者语义仍然分离：
  - auto checkpoint（`checkpoints/auto/`）：压缩流程的运行时恢复产物
  - explicit checkpoint（`checkpoints/latest.md`、`checkpoints/by-session/*`）：
    面向人工审阅和明确交接的耐久产物
- `/checkpoint-resume` 可同时恢复两类文件，优先 explicit checkpoint，
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
- 手动 `/compress-context l3` 视为用户已明确要求重型准备，准备阶段不再二次确认。
- 当上下文债务和 UI 卡顿已经影响执行质量时，应优先写 heavy checkpoint，
  然后用 `/checkpoint-resume` 在新会话续跑。

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

## 当前安装现实

这个项目仍以本地优先为主，Windows 也建议走本地克隆 + 本地构建安装。

当前安装现实：

- 全平台（推荐）：本地克隆 + 本地构建 + 本地文件插件安装
- `Windows x64`（可选便捷路径）：可以走已发布 npm 包
- 非 Windows 平台：仍以本地构建 + 本地安装为准

推荐默认策略：

- 把本地克隆/构建/安装作为主路径
- 把 npm 已发布二进制当作兜底或便捷路径，而不是主工作流

推荐流程：

```bash
bun run build
bun pm pack
```

然后参考：

- [docs/guide/installation.md](docs/guide/installation.md)

### 可直接复制到 OpenCode 的安装提示词

如果你想让 OpenCode 自己去克隆仓库、构建插件、并把本地插件路径接进配置，可以直接把下面这段提示词贴进一个新的 OpenCode 会话：

```text
请你在这台机器上完成 OpenAgent Labforge 的本地开发版安装。

目标仓库：
https://github.com/BOHUYESHAN-APB/openagent-labforge.git

要求：
1. 先把仓库克隆到本地一个合适的工作目录。
2. 这个仓库统一使用 Bun，不要用 npm 或 yarn。
3. 运行最少必要的安装与构建命令，确保最终成功生成 dist/index.js。
4. 修改 %USERPROFILE%\.config\opencode\opencode.json：
   - 把插件数组里加入本地文件插件：
     file:///ABSOLUTE/PATH/TO/openagent-labforge/dist/index.js
   - 如果已经有旧的 openagent-labforge 或 oh-my-opencode npm 安装项，替换为本地文件项，不要保留重复项。
   - 不要覆盖其他无关 provider、model 或已有插件配置。
5. 最后把下面这些结果展示出来：
   - 仓库克隆路径
   - 实际执行的构建命令
   - opencode.json 最终 plugin 数组
   - 是否需要重启 OpenCode Desktop

如果系统缺少 Bun，就不要硬做，直接告诉我该先安装什么。
```

如果你只是想清掉旧会话里的残留状态，而不是重新安装插件：

- 用 `/focus-chat` 把当前会话切回普通问答
- 如果残留还比较重，再用 `/workflow-reset`

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

## 协作说明

维护者说明：

- 多人协作场景下的 Git 合并有时会花更久
- 维护者本人并不擅长复杂的多人 Git 冲突处理
- 某些贡献合并阶段，可能会依赖 AI 先参与审阅、整理和辅助合并

## 文档入口

- [docs/guide/installation.md](docs/guide/installation.md)
- [docs/guide/orchestration.md](docs/guide/orchestration.md)
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
