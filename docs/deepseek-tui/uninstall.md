# DeepSeek-TUI Adapter Uninstall Safety

The DeepSeek-TUI adapter installs files into user-controlled directories. Safe
uninstall is therefore a product requirement, not a cleanup afterthought.

Chinese version: [`uninstall.zh-CN.md`](uninstall.zh-CN.md)

## Manifest location

The planned manifest location is:

```text
~/.deepseek/labforge/install-manifest.json
```

The manifest records all generated commands, skills, MCP snippets, hook snippets,
docs, backups, and stale files from prior versions.

## Ownership marker

Every managed Markdown file should start with a marker like:

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

The marker is intentionally redundant with the manifest. Uninstall should check
both.

## Delete rules

The uninstaller may delete a file only when all of these are true:

1. the file is listed in the manifest;
2. the manifest marks it as owned;
3. the ownership marker is present;
4. the current hash matches the manifest hash.

If the user changed the file, the default action is to preserve it and print a
warning. A future `--force` flag may remove it, ideally after writing a backup.

## Update rules

During update:

- unchanged owned files can be replaced;
- missing files can be recreated;
- files not in the manifest are conflicts by default;
- user-modified files are preserved by default;
- stale owned files can be removed if the hash still matches.

This avoids the common adapter problem where repeated updates leave a trail of
`old`, `improved`, `improved2`, or abandoned generated files.
