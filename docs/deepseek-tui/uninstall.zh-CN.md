# DeepSeek-TUI Adapter 卸载安全

DeepSeek-TUI adapter 会把文件安装到用户目录中。因此安全卸载是产品要求，不是事后清理。

英文版本：[`uninstall.md`](uninstall.md)

## Manifest 位置

计划中的 manifest 位置：

```text
~/.deepseek/labforge/install-manifest.json
```

manifest 记录所有生成的 commands、skills、MCP snippets、hook snippets、docs、backups，以及旧版本遗留文件。

## Ownership marker

每个受管 Markdown 文件都应以类似标记开头：

```md
<!--
extendai-lab-managed: true
adapter: deepseek-tui
packageVersion: 1.0.8
adapterVersion: 0.1.0
fileId: commands/ol-engineer
sha256: ...
-->
```

这个 marker 和 manifest 是有意冗余的。卸载时应同时检查二者。

## 删除规则

只有同时满足以下条件时，uninstaller 才可以删除文件：

1. 文件在 manifest 中；
2. manifest 标记它为 owned；
3. ownership marker 存在；
4. 当前 hash 与 manifest hash 匹配。

如果用户改过文件，默认保留并打印警告。未来 `--force` 可以删除，但最好先写入 backup。

## 更新规则

更新时：

- 未修改的 owned 文件可以替换；
- 缺失文件可以重建；
- 不在 manifest 中的文件默认视为冲突；
- 用户修改过的文件默认保留；
- 旧版本不再需要的 owned 文件，如果 hash 仍匹配，可以删除。

这样可以避免 adapter 多次更新后留下 `old`、`improved`、`improved2` 或其他不可追踪垃圾文件。
