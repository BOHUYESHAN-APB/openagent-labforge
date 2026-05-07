# DeepSeek-TUI Adapter

This adapter is planned as a file/MCP/skill projection of LabForge workflows
into DeepSeek-TUI. It is **not** a first-class runtime plugin, because
DeepSeek-TUI currently does not auto-load plugins.

Current implementation status:

- minimal command-pack install/uninstall is available from the LabForge CLI;
- a small bundled skill pack is installed alongside the command pack;
- MCP snippets and hook snippets are still future work;
- manifest + ownership marker + hash rules already apply to the current command pack.
- when uninstall preserves user-modified files, the manifest is intentionally retained so later cleanup remains safe.

Chinese version: [`README.zh-CN.md`](README.zh-CN.md)

## Supported extension paths

DeepSeek-TUI supports these practical extension surfaces:

- user slash command files in `~/.deepseek/commands/*.md`;
- skills in workspace/global skill directories;
- MCP servers configured in `~/.deepseek/mcp.json`;
- shell hooks in `config.toml`;
- optional local HTTP/SSE runtime API.

LabForge should install adapter assets through those surfaces and track every
installed file in a manifest.

## Current minimal install surface

At the moment the CLI supports a small, safe command-pack installer:

```bash
bunx extendai-lab install dstui
bunx extendai-lab uninstall dstui
```

Optional examples:

```bash
bunx extendai-lab install dstui --dry-run
bunx extendai-lab install dstui --target-root=/custom/.deepseek
bunx extendai-lab uninstall dstui --force
```

What it currently installs:

- `~/.deepseek/commands/ol-engineer.md`
- `~/.deepseek/commands/ol-bio.md`
- `~/.deepseek/commands/ol-plan.md`
- `~/.deepseek/commands/ol-review.md`
- `~/.deepseek/skills/extendai-lab-scientific-rigor/SKILL.md`
- `~/.deepseek/skills/extendai-lab-anti-overconfidence/SKILL.md`
- `~/.deepseek/skills/extendai-lab-bio-research-design/SKILL.md`
- `~/.deepseek/extendai-lab/install-manifest.json`

What it does **not** install yet:

- MCP config snippets
- hook snippets
- runtime API integration

## Default agent vs visible emphasis

The current product config separates these concerns:

- `defaultAgentName` = actual fallback default agent
- `preferredVisibleAgent` = which visible primary expert should appear first or
  feel more prominent in host-facing ordering

For example, you can keep engineering as the default agent while still making
the biological expert feel more prominent in the visible list:

```jsonc
{
  "defaultAgentName": "engineer",
  "preferredVisibleAgent": "bio-analyst"
}
```

The current DeepSeek-TUI command pack still installs both `ol-engineer.md` and
`ol-bio.md`; this config split is about host/default semantics, not command file
presence.

During the current migration window:

- `defaultAgentName` is the preferred field for fallback default-agent behavior.
- `defaultVisibleAgent` is kept only as a compatibility alias.
- `preferredVisibleAgent` is the preferred field for visible ordering/prominence.

## Naming rule for generated files

DeepSeek command names come from Markdown file stems. Therefore command files
must preserve the intended slash command name:

| Purpose | File name | DeepSeek command |
|---------|-----------|------------------|
| Engineer workflow command | `ol-engineer.md` | `/ol-engineer` |
| Planner workflow command | `ol-plan.md` | `/ol-plan` |
| Review workflow command | `ol-review.md` | `/ol-review` |

For managed non-command Markdown assets, LabForge may use the nested suffix
style suggested by the project owner:

```text
engineer.ol.md
visual-qa.ol.md
bio-pack.ol.md
```

The `.ol.md` suffix marks LabForge-owned adapter assets, but it should not be
used for DeepSeek command files unless the intended command is `/engineer.ol`.
For safe uninstall, the manifest and ownership marker are authoritative; file
names are only an additional human-readable convention.

## Install/uninstall rule

The adapter must not scatter unmanaged files into `~/.deepseek`.

Every generated file should include:

1. an install manifest entry;
2. a SHA-256 hash;
3. a machine-readable ownership marker;
4. a conflict policy;
5. backup behavior for user-modified files.

Uninstall should remove only files that are both recorded in the manifest and
still match the ownership marker/hash.

## Capability limits

DeepSeek-TUI with text-only DeepSeek models cannot do native image inspection.
Visual QA should degrade to metadata/SVG source/OCR/PDF text, or use an external
vision MCP if configured.

See also:

- [`../architecture/adapters.md`](../architecture/adapters.md)
- [`uninstall.md`](uninstall.md)
