# CLI Reference

Reference for the current `openagent-labforge` command-line workflow.

---

## Current Reality

The CLI is primarily used for:

- local installation into an OpenCode environment
- environment diagnostics
- non-interactive session running
- MCP OAuth maintenance

At this stage, the most reliable release workflow is still local build + local tarball install.

---

## Basic Usage

```bash
bunx openagent-labforge --help
```

If you already built the local package, you can also use the binary exposed by the installed package.

---

## Commands

| Command | Purpose |
| --- | --- |
| `install` | interactive or non-interactive setup for OpenCode |
| `doctor` | verify install/config/runtime health |
| `run` | non-interactive OpenCode session runner |
| `mcp oauth` | manage OAuth login/logout/status for remote MCPs |
| `get-local-version` | print local package version info |

---

## install

Use the installer when setting up or refreshing the plugin in an OpenCode config directory.

```bash
bunx openagent-labforge install
```

### What it does

1. checks OpenCode installation/config
2. registers the plugin package in OpenCode config
3. writes `openagent-labforge` config
4. bootstraps the managed skill at:
   - `~/.config/opencode/skills/openagent-labforge/SKILL.md`

### Important note

For local development, the practical workflow is still:

1. `bun run build`
2. `bun pm pack`
3. replace the local tgz in the OpenCode config directory
4. run `bun install` there

See `docs/guide/installation.md` for the exact sequence.

---

## doctor

Use doctor to check whether the local install surface is coherent.

```bash
bunx openagent-labforge doctor
```

Typical things it checks:

- OpenCode version and plugin registration
- config parsing and schema validity
- MCP availability / configuration shape
- local runtime prerequisites
- provider/auth wiring

Useful flags:

```bash
bunx openagent-labforge doctor --verbose
bunx openagent-labforge doctor --json
```

---

## run

Run a non-interactive OpenCode session from the CLI.

```bash
bunx openagent-labforge run "summarize this repo"
```

This is mainly useful for scripted checks, CI-style experimentation, or controlled local workflows.

---

## mcp oauth

Manage OAuth state for MCP servers that require remote authorization.

```bash
bunx openagent-labforge mcp oauth login <server-name> --server-url https://example.com/mcp
bunx openagent-labforge mcp oauth logout <server-name>
bunx openagent-labforge mcp oauth status [server-name]
```

This is relevant for remote MCPs, not for local stdio MCPs such as the current `open_websearch_mcp` built-in path.

---

## Config Files

Current config search order is project over user:

1. `.opencode/openagent-labforge.jsonc`
2. `~/.config/opencode/openagent-labforge.jsonc`

JSONC is supported.

Use the generated schema at:

```json
{
  "$schema": "https://raw.githubusercontent.com/BOHUYESHAN-APB/openagent-labforge/main/assets/openagent-labforge.schema.json"
}
```

---

## Release Status

The project is being cleaned for a better public release surface, but the most trustworthy install path remains the local packaging workflow described in `docs/guide/installation.md`.

Treat `install` and `doctor` as stable operator tools; treat future npm/release publishing as a separate release-preparation track.
