# Contributing

Thanks for helping with OpenAgent LabForge.

中文版本见 [`CONTRIBUTING.zh-CN.md`](CONTRIBUTING.zh-CN.md)。

## Project direction

- Keep the implementation in TypeScript.
- Keep new runtime code Node-compatible; avoid new `Bun.*` runtime APIs.
- Do not rewrite in Rust unless OpenCode also moves to Rust or a host exposes a
  stable Rust plugin API that justifies it.
- Treat OpenCode as the full plugin host.
- Treat DeepSeek-TUI as a file/MCP/skill adapter target.
- Treat bioinformatics as the first discipline pack, not the whole product.

## Before changing code

1. Read `codemap.md`.
2. Read the relevant host docs:
   - `docs/opencode/README.md`
   - `docs/deepseek-tui/README.md`
   - `docs/architecture/adapters.md`
3. Keep changes surgical. Do not refactor adjacent code unless required.

## Validation

For code changes, run the relevant subset plus:

```bash
bun run typecheck
bun run build
```

Run targeted tests for touched areas. Use `bun test -t "pattern"` for focused
test runs.

## Documentation rules

- Keep OpenCode and DeepSeek-TUI docs separate.
- Use `ol-` for LabForge slash commands.
- Mention internal IDs only when needed for compatibility.
- Document limitations explicitly; do not imply DeepSeek-TUI has full plugin
  parity with OpenCode.
- Keep English and Chinese docs paired when adding architecture-level guidance.

## Generated files

Do not commit generated packages such as `*.tgz`.

DeepSeek-TUI adapter files must be uninstallable through a manifest and ownership
marker. Do not generate unmanaged files into user directories.
