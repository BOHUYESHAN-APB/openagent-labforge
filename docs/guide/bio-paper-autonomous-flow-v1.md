# 生信 + 论文 多 Agent 自主流程（V1 评审稿）

> 状态：设计草案（供评审）
> 目标：先给出可执行基础逻辑，评审通过后进入实现。

## 1. 设计目标

- 一个自主流程覆盖：问题定义 → 文献检索 → 数据获取（含浏览器）→ 生信分析（R/Python/C 接口）→ 证据整合 → 论文产出。
- 在任何阶段都遵守：用户手选模型优先、可复现、可审计、可回滚。
- Full 与 paper-only 两种发布通道：
  - full：生信 + 论文
  - paper-only：论文流程（不含生信执行）

## 2. Agent 角色分工（V1）

### 已有基础角色

- `metis`：需求澄清 / 风险识别（规划前）
- `momus`：方案评审（执行前）
- `librarian`：外部资料/文献检索
- `explore`：本地代码与结构检索
- `multimodal-looker`：PDF/图表/图像解析
- `atlas`：执行过程协调（任务状态）

### 新增科研角色（已建立代码骨架）

- `bio-methodologist`：生信方法学设计（流程和统计假设）
- `bio-pipeline-operator`：R/Python/外部工具执行与产物追踪
- `paper-evidence-synthesizer`：跨论文证据整合与结论置信度分层

## 3. 自主流程主干（V1）

### Stage A. 任务定义与可证伪目标

1. `metis` 解析目标、约束、证据标准。
2. 输出：
   - 研究问题定义
   - 可证伪假设
   - 最小可行交付（MVP）

### Stage B. 文献检索与证据建库

1. `librarian` + paper-search MCP（候选接入）并行检索。
2. `paper-evidence-synthesizer` 结构化输出：
   - 支持证据
   - 反证据
   - 不确定性与缺口

### Stage C. 数据获取（浏览器优先兜底）

1. 先走常规路径（API/HTTP/CLI）。
2. 若返回空、鉴权页面、动态渲染失败：自动切到浏览器路径（playwright/dev-browser）。
3. 产物要求：
   - 数据文件
   - 获取步骤日志
   - 来源和时间戳

### Stage D. 生信执行（R/Python/C 接口）

1. `bio-methodologist` 给出方法学与质控清单。
2. `bio-pipeline-operator` 执行：
   - R 脚本
   - Python 脚本
   - C/原生工具调用（通过可审计命令封装）
3. 产物：中间结果、最终结果、环境快照。

### Stage E. 论文产出与复核

1. `paper-evidence-synthesizer` 汇总证据与结论强度。
2. 文档技能（docx/pdf/pptx/xlsx）产出交付物。
3. `momus` 做最终计划/结果一致性复核。

## 4. 浏览器驱动采集策略（重点）

- 触发条件：
  - 常规请求空响应
  - 动态前端渲染
  - 站点需要交互后下载
- 处理原则：
  - 首先最小化自动化步骤
  - 全程记录关键动作（点击、筛选、下载）
  - 下载后立即做文件完整性检查

## 5. R/Python/C 接口接入原则

- 统一入口：`bio-pipeline-operator` 调度。
- 执行前必须检查：
  - 环境可用性（R/Python/编译工具）
  - 依赖版本
  - 输入数据完整性
- 执行后必须输出：
  - 命令与参数
  - 产物路径
  - 错误与重试信息

## 6. 模型策略（硬约束）

- 用户手动选模 > 任何 fallback/default。
- AUTO 只在用户明确选择 AUTO 时生效。
- 会话连续输入不应触发隐式换模。

## 7. MCP 集成与合规（V1）

- 在候选 MCP 接入前，必须通过：
  - `docs/guide/mcp-license-checklist.md`
  - `plugins/opencode-mcp-paper-search/MCP_CANDIDATES.md` 记录。
- 许可证优先级：MIT/Apache/BSD/ISC。
- 第三方声明同步更新：`THIRD_PARTY_NOTICES.md`。

## 8. Full / Paper-only 行为差异

- Full：启用所有阶段（A→E）。
- Paper-only：关闭 Stage D 的生信执行，仅保留文献/证据/论文链路。

## 9. 与 SOUL 原则对齐

关键对齐点（来自 `C:/Users/BoHuYeShan/Downloads/soul.md`）：
- 第一性原理：先解构问题再执行。
- 批判性质疑：发现方案风险时必须指出并给替代路径。
- 可证伪性：输出可检验假设与失败条件。
- 证据驱动：结论必须可追溯到来源。
- 可重复性：记录环境、参数、流程。

## 10. 评审后实现顺序（建议）

1. 固化角色与 profile 开关（full/paper-only）。
2. 接入第一批 paper-search MCP（2-3 个）。
3. 接入浏览器兜底采集链路。
4. 接入 R/Python/C 执行封装。
5. 完成端到端验证与文档发布。
