# CHANGELOG Audit

首次审计日期：2026-05-09  
状态：进行中

## 目标

逐条核对 `CHANGELOG.md` 中已经声称完成的功能，确认它们在当前仓库里是否：

- 真实存在
- 已接线
- 有测试或验证支撑
- 文案是否夸大 / 失真 / 仍属未闭环状态

## 状态图例

- `verified`：代码、接线、测试/验证基本齐全
- `partial`：基础能力存在，但还没闭环，或只做到语义/文件层
- `overstated`：方向成立，但 CHANGELOG 表述比实际成熟度更高
- `stale`：当前文案已不准确或和现状不一致

---

## v1.0.19

### document-output / save_plan / start-work
- 状态：`verified`
- 证据：
  - `src/index.ts`
  - `src/tools/save-plan.ts`
  - `src/tools/save-plan.test.ts`
  - `src/plans/service.ts`
  - `src/plans/service.test.ts`
  - `src/hooks/start-work/index.ts`
  - `src/hooks/start-work/index.test.ts`

### compatibility foundation（capabilities / adapters / install-plan / backup / rollback / doctor / renderer registry）
- 状态：`verified`
- 证据：
  - `src/compat/capabilities.ts`
  - `src/compat/install-plan.ts`
  - `src/compat/backup.ts`
  - `src/compat/rollback.ts`
  - `src/compat/doctor.ts`
  - `src/compat/renderers/registry.ts`
  - 对应 `*.test.ts`

### OpenClaude / Codex install/apply + activation bridge
- 状态：`partial`
- 结论：
  - 真实的 install/apply/rollback、runtime-root、manifest-backed 路径都已存在。
  - OpenClaude activation bridge 已对齐 Claude-family 本体的主要状态形态：`settings.json.enabledPlugins`、`settings.json.extraKnownMarketplaces`、`plugins/installed_plugins.json`、`plugins/known_marketplaces.json`、`.claude-plugin/plugin.json`。
  - Codex activation bridge 已修正为 host loader 形态：marketplace root 在 runtime root，插件资产放在 `plugins/cache/extendai-lab-local/extendai-lab/local`，`config.toml` 同时启用 `[features] plugins = true` 和 `[plugins."extendai-lab@extendai-lab-local"] enabled = true`。
  - 但 host-process acceptance 仍然依赖 reload/restart 和运行时 discovery 确认，不能写成“已经完全可用”。
- 证据：
  - `src/cli/compat.ts`
  - `src/compat/adapters/openclaude.ts`
  - `src/compat/adapters/codex.ts`
  - `src/cli/compat.test.ts`

### CLI runtime selector consistency
- 状态：`verified`
- 结论：
  - 修复了 compat CLI 中 `claude` 与 adapter profile `claude-code` 不一致的问题。
  - CLI 仍接受旧输入 `claude`，但规范化为真实 runtime id `claude-code`。
- 证据：
  - `src/cli/index.ts`
  - `src/cli/types.ts`
  - `src/cli/compat.ts`
  - `src/cli/ui.ts`

### memory / evolution baseline
- 状态：`partial` / `overstated`
- 结论：
  - memory capsules / promoted behavior / reference lessons / handoff primitives 已经有基础代码。
  - 但更接近“baseline primitives + reference boundaries”，而不是一个完全闭环、全面接入 runtime 的成熟系统。
  - CHANGELOG 当前表述偏满，建议后续降级措辞。
- 证据：
  - `src/memory/evolution.ts`
  - `src/memory/types.ts`
  - `src/memory/reference-lessons.ts`
  - `src/memory/index.ts`
  - `src/checkpoint/manager.ts`

### stronger reminder / review / context-pressure flow
- 状态：`partial`
- 结论：
  - reminder、auto-review、context-pressure 的主链存在。
  - 但 `todo-continuation` 曾存在关键缺陷：todo 未完成时，模型自说自话问句会导致 auto-pause。
  - 本轮已开始修复，但 CHANGELOG 里的“已强化”为时过早，仍需继续验收。
- 证据：
  - `src/hooks/todo-continuation/index.ts`
  - `src/hooks/todo-continuation/index.test.ts`

---

## v1.0.18

### subagentPolicy modes + complete slash commands
- 状态：`verified`
- 证据：
  - `src/index.ts`
  - `src/agents/index.ts`
  - `src/agents/index.test.ts`

### “main-agent-first” default semantics
- 状态：`partial`
- 结论：
  - 注册裁剪和 prompt 基线存在。
  - 但旧文案、旧策略、旧 heavy/turbo prompt 中仍残留 delegation-first 倾向；本轮已开始清理。

---

## v1.0.17 / v1.0.16 / v1.0.15 / v1.0.14

### manual memory commands / preference persistence / auto preference capture
- 状态：`verified`
- 证据：
  - `src/hooks/memory-commands.ts`
  - `src/hooks/memory-commands.test.ts`
  - `src/checkpoint/manager.ts`
  - `src/checkpoint/persistence.test.ts`

### context-pressure checkpoint-first continuation / review outcome persistence
- 状态：`partial`
- 结论：
  - 主体能力存在。
  - 但 continuation/review 在真实行为上仍有未清完的问题，因此不能把整条链视为已完全成熟。

---

## v1.0.13 / v1.0.9

### DeepSeek-TUI minimal adapter / groundwork
- 状态：`partial`
- 结论：
  - minimal install/uninstall 和 groundwork 路径存在。
  - 当前仍应严格表述为“最小文件级适配”，不能暗示已达到完整 plugin/runtime parity。
- 证据：
  - `src/cli/index.ts`
  - README 中 DeepSeek-TUI 章节

---

## v1.0.12 / v1.0.11

### bio skills catalog / bio-analyst role expansion
- 状态：`verified`
- 证据：
  - `resources/bioSkills/catalog.json`
  - `src` 中 bio skill catalog 相关代码与测试

---

## 当前优先修复建议

1. 继续把 `todo-continuation` / auto-review / todo hygiene 做成强制、可见、可解释的主链。
2. 继续清理所有 prompt / README / docs 中残留的 delegation-first 文案。
3. 把 OpenClaude / Codex 的状态统一改写成：语义接线已完成，但 process acceptance 仍 pending。
4. 把 memory/evolution 的表述降级成“baseline / primitives / partial integration”，避免继续夸大。
5. 每修完一条主链，就反向更新本审计文档，而不是只改代码不改说明。

---

## 备注

本文件是第一轮审计，不代表最终结论。后续应继续补：

- 更完整的版本级逐条核验
- 文档与 README 的同步检查
- CLI 实际行为与 CHANGELOG 声称的一致性复核
