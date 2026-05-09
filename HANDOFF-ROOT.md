---
status: in-progress
updated: 2026-05-09
scope: long-session-handoff
---

# Root Handoff

## Goal
在当前超长会话与 checkpoint 失效的情况下，把主线任务手动落到仓库根目录，便于新会话直接接续。

## 三档主线

### A档：必须立刻继续
1. 审核 `CHANGELOG.md` 中已经声称完成的功能，逐项确认当前项目里是否真的存在、可用、已接线、已验证。
2. 把“主代理优先、子代理仅在真正并行时才允许真实启动”的原则，继续落实到所有主代理与相关策略逻辑中。
3. 把子代理能力进一步收敛成主代理可直接调用的工具 / checklist / 动态提示词，而不是默认开新会话等待结果。

### B档：当前技术主线
1. 继续三大开源 CLI（OpenCode / OpenClaude / Codex）的真实 install/apply / discovery / activation closure。
2. 继续 host-visible validation / process-acceptance 语义校验与状态输出。
3. 继续统一 compat 存储路径、install-state、backup/rollback、doctor/status/install/rollback CLI 形态。

### C档：完成后再扩展
1. 再回头处理 closed-source Claude later 路线。
2. 再继续 CLI 美化/UI 细节与其他次级体验优化。
3. 再继续更深层的 capability degradation / multi-runtime smoke / 更完整 installer closure。

## 当前已完成的重要基线
- `v1.0.19` 已经真正发布到远端 GitHub Release。
- planner/save_plan/document-output 基线已落地。
- compatibility foundation（capabilities / adapters / install-plan / backup / rollback / doctor / renderer registry）已落地。
- OpenClaude / Codex 已有真实 install/apply + runtime-root + manifest-backed rollback baseline。
- OpenClaude / Codex activation bridge 已接入：
  - OpenClaude: `.claude.json` + `settings.json.enabledPlugins` + `plugins/installed_plugins.json` + `plugins/known_marketplaces.json`
  - Codex: `.codex-plugin` assets + `.mcp.json` + `.app.json` + `.agents/plugins/marketplace.json` + `config.toml` managed marketplace/MCP blocks
- `ultra-minimal` 已是默认 subagent policy。
- reminder/review 已强化为更强的用户可见提醒与更严格 review。

## 当前未完成的关键点
1. 必须审核 `CHANGELOG.md` 里所有已写出来的功能，确认代码、文档、测试、CLI/运行时行为是否真的对得上。
2. checkpoint 在长会话下失效，后续不能只依赖 checkpoint，必须优先维护根目录 handoff 文档。
3. “主代理优先、子代理只在真正并行时才允许启动”的原则虽然已经开始写入 orchestrator/deep-worker/atlas/bio/chem/prompt 文案，但还要继续检查：
   - 是否所有主代理都一致
   - 是否只是 prompt 层，还是已经真正影响策略/行为
   - 是否还残留默认鼓励开子代理的文案/测试/文档
4. 子代理能力工具化 / checklist 化 / 动态提示词化 还没有正式实现完，只是原则已经明确。

## 2026-05-09 本轮修复进展
- 已修复 `todo-continuation` 的一个关键逻辑：todo 未完成时，普通 assistant 问句（如 “Should I continue?”）不再触发 auto-pause。
- 已收紧 auto-continue：用户“好的/ok/looks good”这类满意信号在 todo 仍未完成时，不再误关 continuation；只有显式 stop 才会停。
- 已把 auto-continue 的用户可见提醒加强为带剩余 todo 摘要，方向上更接近 Omo 的“强制继续 / 用户可见解释”机制。
- 已把 orchestrator / heavy / turbo / `/ol-subagents-*` 文案改成更硬的 main-agent-first：默认主代理自己做，子代理视为 checklist / 明确允许后的例外。
- 仍待继续：review 机制进一步清理、README/docs 全面同步、CHANGELOG 审计文档持续补完。

## 当前硬约束（新增）
- 当前修复阶段默认禁止使用子代理；主会话自己完成。
- auto 模式下，todo 未完成时不能因为模型自说自话的问句而停住。
- 真要问用户时，应优先走运行时原生 question/clarification 机制，而不是在聊天正文里用 “Should I continue?” 之类 filler 问句。

## 当前最新用户要求（必须保真）
- “所有主代理，包括生物信息学的代理都要落实这个原则。”
- “此代理无论是开启哪一个情况下注册的子代理都是有且只有能同时进行的情况下才能够使用完成任务。”
- “默认的话，在任何情况下所有子代理都是可以工具的形式，让主代理也就是主代理自己就可以成为子代理去干这种事情。”
- “关键在于我们要确定要把我们现在在 change log 里边，所有的功能都要审核一遍，确保我们当前项目是真的有用的，做到了这些内容。”
- “当前会话实在是上下文太严重了……必须把交接文档放到根目录。”

## 下一会话建议起手动作
1. 先读本文件 `HANDOFF-ROOT.md`
2. 再读 `CHANGELOG.md`
3. 把 CHANGELOG 条目拆成审核 checklist
4. 从“主代理优先 / 子代理工具化”与“CHANGELOG 功能核对”两条线并行推进
