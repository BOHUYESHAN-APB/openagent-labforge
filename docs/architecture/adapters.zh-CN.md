# 宿主 Adapter 架构

OpenAgent LabForge 正在转向“宿主 adapter”架构：

- **OpenCode** 仍然是完整 runtime plugin 宿主。
- **DeepSeek-TUI** 是 adapter 目标，不是完整 plugin 宿主。
- 可复用能力应逐步抽成宿主无关的 TypeScript 资产。

英文版本见 [`adapters.md`](adapters.md)。

## 产品边界

当前 GitHub 仓库仍叫 `openagent-labforge-bio`，这是历史原因。这个名字代表最早的生信方向，不再代表未来产品边界。

目标命名：

- 产品 / package：`openagent-labforge`
- 未来 GitHub 仓库：`openagent-labforge`
- 第一个可选学科包：`bio`
- 当前仓库名：迁移完成前的历史兼容别名

不要随意直接改远端或 release tag。安全迁移路径是：

1. 在文档中说明历史 `-bio` 名称。
2. 保持当前仓库 release 可用。
3. 把 bio 行为拆成 discipline pack。
4. 当安装文档、package metadata、GitHub redirect、release 自动化准备好后，再 rename GitHub 仓库。

## Runtime 模型

OpenCode 和 DeepSeek-TUI 不是同构宿主。

| 能力 | OpenCode plugin | DeepSeek-TUI adapter |
|------|-----------------|----------------------|
| Runtime plugin 加载 | 有 | 没有一等 runtime plugin API |
| Agent 注册 | 有 | 通过 commands/skills 投影 |
| Tool 注册 | Plugin tools + MCP | MCP 是主要外部工具通道 |
| 生命周期 hook | typed plugin hooks | config 中的 shell hooks |
| Slash commands | plugin command registry | `~/.deepseek/commands` 下的 Markdown 文件 |
| Skills | 插件打包 skills | Skill 目录 + `load_skill` |
| Session 控制 | OpenCode SDK | 可选本地 HTTP/SSE runtime API |

所以 LabForge 不应伪装成一个“万能 runtime plugin”。正确模型是：

```text
LabForge core assets
  -> OpenCode full plugin adapter
  -> DeepSeek-TUI file/MCP/skill adapter
```

## TypeScript 与 Node 兼容

LabForge 保持 TypeScript。除非 OpenCode 也切到 Rust，或者 DeepSeek-TUI 提供稳定 Rust plugin API，否则不要重写成 Rust。

新增共享代码和 adapter 代码应保持 Node-compatible：

- 文件、路径、进程、crypto、fetch 优先使用 Node 标准 API。
- 避免新增 `Bun.*` runtime API。
- Bun 暂时可继续作为 build/test 工具。
- 后续 CI 应增加 built CLI 的 Node smoke check。

## 最小目录方向

不要大爆炸搬迁 `src/index.ts`。先加边界：

```text
src/
  index.ts                    # 当前 OpenCode plugin 入口，保持稳定
  adapters/
    deepseek-tui/             # file/MCP/skill adapter 骨架
  core/                       # 未来宿主无关 prompt/spec 资产
  disciplines/
    bio/                      # 未来 bio discipline pack
```

如果 adapter 稳定，再逐步演进为 packages：

```text
packages/core/
packages/opencode-plugin/
packages/adapters/deepseek-tui/
packages/mcp-server/
```

## DeepSeek-TUI adapter 原则

DeepSeek-TUI 当前主要消费放置文件和外部服务：

- 用户 slash commands：`~/.deepseek/commands/*.md`
- skills：workspace/global `SKILL.md` 目录
- MCP：`~/.deepseek/mcp.json`
- hooks：`config.toml` shell hooks
- 可选 runtime API client

因此安装/卸载安全是基础设施。所有生成文件都必须写入 manifest，并带 ownership marker。卸载只能删除 LabForge 拥有且用户未修改的文件。

## 模式映射

LabForge 自己定义 mode 语义，宿主只是尽量映射。

| LabForge mode | OpenCode 映射 | DeepSeek-TUI 映射 |
|---------------|---------------|-------------------|
| `plan` | `planner` / plan-only agent | Plan command / skill |
| `agent` | 普通权限 agent | Agent command / skill |
| `auto` | auto-continue + review gate | Agent 或弱 YOLO prompt 约束 |
| `yolo` | 高自治 agent + 安全边界 | DSTUI YOLO mode + guardrails |
| `review` | oracle/reviewer/council | review command / skill |
| `bio` | `bio-analyst` discipline pack | bio command / skill pack |

不要把 OpenCode hooks、task session reuse、multiplexer 逻辑直接复用到 DeepSeek-TUI adapter。

## 视觉能力边界

DeepSeek-TUI 搭配 DeepSeek 文本模型时应视为 text-first。Flash 没有原生视觉。视觉 QA 必须优雅降级：

1. text-only metadata / 文件名 / SVG 源码；
2. 可用时使用 OCR 或 PDF 文本抽取；
3. 配置外部 vision MCP 时调用外部视觉；
4. 只有宿主/模型真正支持视觉时才做原生图像检查。

不要在没有真实视觉通道时声称 DeepSeek-TUI 能直接看图。
