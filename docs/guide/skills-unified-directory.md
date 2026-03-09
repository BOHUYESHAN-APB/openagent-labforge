# Unified Skills Directory and Bundle Strategy

Labforge now treats builtin skills and curated external skills as one functional catalog.

## Goals

- Keep a single low-token preview surface for skills
- Preserve stable public skill IDs
- Separate `full` and `paper` at bundle generation time, not at runtime merge logic

## Generated outputs

Run:

```bash
bun run build:skills-catalog
```

This generates:

- `generated/skills-bundles/catalog.json`
- `generated/skills-bundles/full/INDEX.md`
- `generated/skills-bundles/paper/INDEX.md`
- `generated/skills-bundles/full/skills/...`
- `generated/skills-bundles/paper/skills/...`

## Runtime configuration

Use:

```jsonc
{
  "skills": {
    "bundle": "full"
  }
}
```

or:

```jsonc
{
  "skills": {
    "bundle": "paper"
  }
}
```

The bundle source is injected automatically by `discoverConfigSourceSkills(...)`.

## Metadata-first behavior

File-based skills now expose preview metadata first:

- `name`
- `description`
- `category`
- `scope`

Skill instruction bodies are loaded lazily only when the skill is actually invoked.

## Naming rules

- Builtin skill IDs remain stable (`playwright`, `web-research`, `git-master`, etc.)
- Curated external bundle skills use source-prefixed IDs to avoid collisions (for example `openai-curated/openai-docs`, `anthropic/mcp-builder`)
- Generated directory entries use unique slugs to avoid collisions between sources
- Source provenance remains in `catalog.json`, `INDEX.md`, and third-party notices

## Bundle split

- `paper`: research, writing, browser verification, safe engineering helpers
- `full`: `paper` plus selected broader engineering/productivity skills
