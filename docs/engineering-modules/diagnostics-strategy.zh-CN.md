# Diagnostics Strategy / 诊断策略

## Purpose

防止验证策略退化成单一宿主或单一语言假设，例如“LSP 永远可用”或者
“typecheck 对所有语言都够了”。

## When to inject

- 实现后的验证
- 重构后的验证
- bug 修复后的验证
- code review / release-ready 检查
- 任何声称“代码已正确 / 已可发布”的流程

## Required behaviors

- 如果目标语言存在可靠 LSP 路径，优先使用 LSP diagnostics。
- 如果 LSP 不可用或对该语言/工具链覆盖不完整，就使用该语言自己的诊断方式。
- 接受多种有效诊断路径，例如：
  - TypeScript: `tsc --noEmit`
  - Python: `ruff`、`pyright`、`pytest`
  - R: `Rscript`、`lintr`、包自身检查
  - Rust: `cargo check`、`clippy`
  - Go: `go test`、`go vet`
- 明确写出这次实际使用了哪条诊断路径。
- 区分“诊断”与更广义的验证：tests、build、runtime checks、scientific validation 不是同一层东西。

## What it must reject or push back on

- 只跑了一个很窄的 checker 就声称“已验证”
- 默认假设 OpenCode 对所有语言都有完整 LSP 支持
- 把 type diagnostics 当成 tests / runtime verification 的替代品
- 因为没有 LSP 就完全跳过验证

## Output expectations

输出中应明确：

- 本次用了哪条 diagnostics 路径；
- 它是 LSP 还是语言自带诊断；
- 还缺哪些更高层验证。

## Related modules / related skills

- [`scientific-rigor.md`](scientific-rigor.md)
- [`anti-overconfidence.md`](anti-overconfidence.md)

## Notes for contributors

- 保持模块宿主中立：现在适用于 OpenCode，未来也应适用于其他宿主。
- 不要把某一种语言生态硬编码成通用默认方案。
- CI / GitHub Actions 属于更高一层验证，不是本地 diagnostics 的替代品。
