# DeepSeek-TUI Adapter

这个 adapter 计划把 LabForge 工作流投影到 DeepSeek-TUI 的文件、MCP、skills 机制中。它**不是**一等 runtime plugin，因为 DeepSeek-TUI 目前不会自动加载 plugins。

当前实现状态：

- 已提供最小 command pack 的安装/卸载；
- 已同时提供一小组内置 skills；
- MCP snippets、hook snippets 还没有接入；
- 当前 command pack 已经使用 manifest + ownership marker + hash 做安全管理；
- 如果卸载时保留了用户修改过的文件，manifest 也会保留，避免后续丢失追踪。

英文版本：[`README.md`](README.md)

## 支持的扩展面

DeepSeek-TUI 当前可用的扩展面是：

- `~/.deepseek/commands/*.md` 用户 slash command 文件；
- workspace/global skill 目录；
- `~/.deepseek/mcp.json` 中配置的 MCP servers；
- `config.toml` 中的 shell hooks；
- 可选本地 HTTP/SSE runtime API。

LabForge adapter 应通过这些扩展面安装资产，并用 manifest 记录每一个安装文件。

## 当前最小安装范围

目前 CLI 只支持一个小而安全的 command-pack 安装器：

```bash
bunx extendai-lab install dstui
bunx extendai-lab uninstall dstui
```

可选示例：

```bash
bunx extendai-lab install dstui --dry-run
bunx extendai-lab install dstui --target-root=/custom/.deepseek
bunx extendai-lab uninstall dstui --force
```

当前会安装：

- `~/.deepseek/commands/ol-engineer.md`
- `~/.deepseek/commands/ol-bio.md`
- `~/.deepseek/commands/ol-plan.md`
- `~/.deepseek/commands/ol-review.md`
- `~/.deepseek/skills/extendai-lab-scientific-rigor/SKILL.md`
- `~/.deepseek/skills/extendai-lab-anti-overconfidence/SKILL.md`
- `~/.deepseek/skills/extendai-lab-bio-research-design/SKILL.md`
- `~/.deepseek/extendai-lab/install-manifest.json`

当前**不会**安装：

- MCP 配置片段
- hook snippets
- runtime API 集成

## 生成文件命名规则

DeepSeek command 名来自 Markdown 文件名 stem。因此 command 文件必须保留预期 slash command 名：

| 用途 | 文件名 | DeepSeek 命令 |
|------|--------|---------------|
| Engineer workflow command | `ol-engineer.md` | `/ol-engineer` |
| Planner workflow command | `ol-plan.md` | `/ol-plan` |
| Review workflow command | `ol-review.md` | `/ol-review` |

对于非 command 的受管 Markdown 资产，可以采用项目建议的嵌套扩展名风格：

```text
engineer.ol.md
visual-qa.ol.md
bio-pack.ol.md
```

`.ol.md` 后缀用于标记 LabForge-owned adapter 资产，但不要直接用于 DeepSeek command 文件，除非预期命令就是 `/engineer.ol`。安全卸载时，manifest 和 ownership marker 才是权威依据；文件名只是额外的人类可读约定。

## 安装/卸载规则

adapter 不应把不可追踪的垃圾文件散落到 `~/.deepseek`。

每个生成文件都应包含：

1. install manifest 记录；
2. SHA-256 hash；
3. 机器可读 ownership marker；
4. conflict policy；
5. 用户修改文件的备份策略。

卸载只删除同时满足 manifest 记录、ownership marker 存在、hash 匹配的文件。

## 能力限制

DeepSeek-TUI 搭配 text-only DeepSeek 模型时不能做原生图片检查。视觉 QA 应降级到 metadata、SVG 源码、OCR、PDF 文本，或者使用外部 vision MCP。

参见：

- [`../architecture/adapters.zh-CN.md`](../architecture/adapters.zh-CN.md)
- [`uninstall.zh-CN.md`](uninstall.zh-CN.md)
