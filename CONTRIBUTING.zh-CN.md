# 贡献指南

感谢你帮助改进 ExtendAI Lab。

英文版本见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## 项目方向

- 继续使用 TypeScript。
- 新增 runtime 代码保持 Node-compatible；避免新增 `Bun.*` runtime API。
- 除非 OpenCode 也切到 Rust，或者宿主提供稳定 Rust plugin API，否则不要重写成 Rust。
- OpenCode 是完整 plugin 宿主。
- DeepSeek-TUI 是 file/MCP/skill adapter 目标。
- Bioinformatics 是第一个 discipline pack，不是整个产品边界。

## 改代码前

1. 先读 `codemap.md`。
2. 阅读相关宿主文档：
   - `docs/opencode/README.zh-CN.md`
   - `docs/deepseek-tui/README.zh-CN.md`
   - `docs/architecture/adapters.zh-CN.md`
   - `docs/architecture/engineering-modules.zh-CN.md`
3. 保持外科手术式修改。除非必要，不要顺手重构相邻代码。

## 验证

代码改动至少运行相关测试，并运行：

```bash
bun run typecheck
bun run build
```

针对具体区域使用 focused tests。可用 `bun test -t "pattern"` 运行单项测试。

## 文档规则

- OpenCode 和 DeepSeek-TUI 文档分开维护。
- 可复用的 prompt discipline 规则应优先落在 `docs/engineering-modules/`
  中，而不是只散落在多个 prompt 里。
- LabForge slash commands 使用 `ol-` 前缀。
- 只有兼容性需要时才提 internal IDs。
- 明确写出限制；不要暗示 DeepSeek-TUI 与 OpenCode plugin 能力完全等价。
- 新增架构级文档时尽量同时提供中英文版本。

## 生成文件

不要提交 `*.tgz` 这类生成包。

DeepSeek-TUI adapter 生成文件必须能通过 manifest 和 ownership marker 安全卸载。不要向用户目录写入不可追踪文件。

## 新增可复用 prompt / rigor 模块

如果一种新行为应该作用于多个 agent 或多个 workflow：

1. 先在 `docs/engineering-modules/` 中新增或更新对应模块文档
2. 保持模块跨 agent、可复用
3. 然后再用小而明确的 prompt 改动去接入它

不要先把大量段落复制进多个 agent prompt，再回头补文档。
