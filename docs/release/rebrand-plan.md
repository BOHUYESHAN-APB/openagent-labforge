# Rebrand Plan: New Package Identity and 1.0.0 Baseline

This document defines the migration from upstream-compatible publishing identity to an independent Labforge package line.

## Decision

- Publish under a new npm identity.
- Start semantic versioning at `1.0.0` for the new package name.
- Keep compatibility notes for users migrating from `openagent-labforge`.

## Target Package Names

- Core plugin (new primary): `@labforge/openagent-labforge-core`
- Companion plugin: `@labforge/opencode-agent-bio-paper`
- Companion MCP plugin: `@labforge/opencode-mcp-paper-search`
- Aggregate install meta package (full): `@labforge/openagent-labforge`
- Aggregate install meta package (paper-only): `@labforge/openagent-labforge-paper`

## Why 1.0.0 Is Correct Here

- New package name means new semver lineage.
- Current `openagent-labforge@3.11.0` cannot be republished.
- A reset baseline reduces confusion and signals independent governance.

## Migration Scope (Code + Runtime)

The following areas contain `openagent-labforge`-bound identity and must be migrated before release:

1. package metadata
   - `package.json` (`name`, `bin`, optional dependency names, repo links)
   - platform package manifests under `packages/*/package.json`

2. CLI naming and installer
   - CLI command name currently tied to `openagent-labforge`
   - install prompts and config manager plugin entry logic

3. config file and path conventions
   - `.opencode/openagent-labforge.jsonc`
   - `~/.config/opencode/openagent-labforge.jsonc`
   - fallback handling for legacy filename during migration

4. cache / data / logs
   - cache subdirectory names using `openagent-labforge`
   - auto-update and doctor package constants

5. docs and examples
   - install snippets, CLI references, schema paths, troubleshooting docs
   - README/README.zh-cn publish and migration sections

6. tests
   - assertions expecting old package name/config paths

## Compatibility Strategy

- Continue reading legacy config files during transition.
- Prefer new config filename when both exist.
- Keep migration note in README:
  - old package uninstall command
  - new package install command
  - config filename migration behavior

## Release Sequence

1. Ship identity migration in core repository.
2. Release `@labforge/openagent-labforge-core@1.0.0`.
3. Release companion plugins under `@labforge/*` names.
4. Release aggregate meta packages for one-command onboarding.
5. Mark old install path as legacy in docs.

## Non-Goals

- Force-updating upstream users automatically.
- Breaking existing legacy config loading without transition window.

