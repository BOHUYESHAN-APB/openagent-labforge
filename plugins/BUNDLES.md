# Bundle Matrix (full vs paper-only)

This document defines bundle composition for companion plugin delivery.

## Goals

- Keep a single stable core plugin.
- Offer a lightweight paper workflow bundle.
- Offer a full research bundle with bioinformatics workflow enabled.
- Keep user model choice as first priority in all profiles.

## Bundle Definitions

### full

- Includes:
  - `@labforge/openagent-labforge-core` (core)
  - `opencode-agent-bio-paper`
  - `opencode-mcp-paper-search`
- Profile defaults:
  - literature workflow: enabled
  - bio workflow: enabled
  - paper formatting presets: enabled
  - skills bundle: `full`

### paper-only

- Includes:
  - `@labforge/openagent-labforge-core` (core)
  - `opencode-agent-bio-paper`
  - `opencode-mcp-paper-search`
- Profile defaults:
  - literature workflow: enabled
  - bio workflow: disabled
  - paper formatting presets: enabled
  - skills bundle: `paper`

## Compatibility Contract

- Companion plugins require core `>=3.11.0 <4.0.0`.
- Bundle manifests are source-of-truth for installation automation.
- Any breaking API change in core requires:
  - companion plugin compatibility update
  - bundle manifest update
  - migration note in README

## Installation Skeleton

```jsonc
{
  "plugin": [
    "@labforge/openagent-labforge-core",
    "opencode-agent-bio-paper",
    "opencode-mcp-paper-search"
  ]
}
```

Then apply one profile:

- full profile: `plugins/opencode-agent-bio-paper/profiles/full.jsonc`
- paper-only profile: `plugins/opencode-agent-bio-paper/profiles/paper-only.jsonc`
- generated full skills bundle: `generated/skills-bundles/full/`
- generated paper skills bundle: `generated/skills-bundles/paper/`

## Release Checklist

1. Core regression checks (typecheck, build, critical tests).
2. Companion plugin regression checks.
3. Validate bundle manifests and profile snippets.
4. Publish release notes with compatibility ranges.
