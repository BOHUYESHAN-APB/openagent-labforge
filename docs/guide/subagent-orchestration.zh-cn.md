# 子 Agent 编排与任务关系（含 Multimodal-Looker）

## 1. 当前内置 Agent 全景

来源：内置注册表与 schema。

- 顶层编排/主控（primary 或 all，通常不作为普通子任务被调用）
1. sisyphus
2. wase
3. hephaestus
4. atlas
5. prometheus（计划家族）
6. sisyphus-junior（按 category 派生执行）

- 可作为子任务调用的核心专业 Agent（subagent 或 all）
1. oracle
2. librarian
3. explore
4. github-scout
5. tech-scout
6. acceptance-reviewer
7. article-writer
8. scientific-writer
9. bio-autopilot
10. bio-orchestrator
11. multimodal-looker
12. bio-methodologist
13. wet-lab-designer
14. bio-pipeline-operator
15. paper-evidence-synthesizer
16. metis
17. momus

## 2. Multimodal-Looker 在体系里的定位

- mode: subagent
- 职责：解释型多模态读取（PDF、图片、图表、文档嵌图），输出“已提取结论”，而非原文逐字内容。
- 工具权限：只允许 read（最小权限读取策略）。
- 触发工具链：
1. look_at 负责组装文件 parts（本地文件、目录多图、DOCX/PPTX 嵌图解包）
2. 发送到 multimodal-looker 子会话
3. 返回结构化文本结论给主 agent

## 3. 调度原则（建议统一）

- 原则 A：主控只做编排，不做重体力解析。
- 原则 B：文档/图像解释统一收敛到 multimodal-looker。
- 原则 C：写作与证据分离。
  - 证据抽取：multimodal-looker / librarian / paper-evidence-synthesizer
  - 文稿生成：article-writer / scientific-writer
- 原则 D：评审闭环必须独立。
  - acceptance-reviewer（实现验收）
  - momus（计划/逻辑审查）

## 4. 面向“论文插图”的标准工作流

适用场景：用户给了作物图片、文档里有嵌图、AI 自己生成图后要判断放在哪一节。

1. 主控（sisyphus/wase/hephaestus）接收写作任务。
2. 若输入是目录：look_at 批量送图给 multimodal-looker，输出每张图语义标签与用途。
3. 若输入是 DOCX/PPTX：look_at 解包嵌图并一并分析，输出“图-段落/章节候选关系”。
4. 主控调用 article-writer 或 scientific-writer 产正文草稿。
5. 再调用 multimodal-looker 对“AI 新生成图”执行二次理解与一致性校验。
6. 最后由 acceptance-reviewer（必要时叠加 momus）做可用性与位置合理性复核。

## 5. 任务关系矩阵（建议）

- 主控 → 证据层
1. explore：仓内快速定位
2. librarian：外部资料查证
3. multimodal-looker：图像/图表/版式语义解析

- 主控 → 生产层
1. article-writer：通用文章产出
2. scientific-writer：科研论文产出

- 主控 → 质量层
1. acceptance-reviewer：实现与需求一致性
2. momus：计划与推理链质量

## 6. 落地约束

1. 禁止将 primary agent 作为普通 task 子调用。
2. 计划家族（plan/prometheus）避免互相递归委派。
3. 需要多模态判断时，优先走 look_at -> multimodal-looker，而非直接 read 文本化。
4. 多图任务先抽“图语义摘要表”，再进入正文插图决策。

## 7. 推荐下一步（可立即执行）

1. 在 start-work 或 bootstrap skill 里加入“图文任务自动分流规则”：命中图片/图表关键词时强制先走 multimodal-looker。
2. 给 multimodal 输出定义统一结构：
   - image_id
   - semantic_role
   - recommended_section
   - insertion_rationale
   - confidence
3. 在写作后置一个“图文一致性复核”子步骤，防止图与段落语义错配。

## 8. 图像生成功能筹备状态

当前状态：

1. 图像生成能力保持配置门控，不默认开启。
2. 外部服务平台 API 的参数与鉴权需求仍在收集阶段。
3. 在 API 合同稳定前，继续保持 SVG-first 回退策略，并把重点放在“生成后语义复核”链路上。
