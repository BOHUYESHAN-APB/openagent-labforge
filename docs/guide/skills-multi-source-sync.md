# Skills Multi-Source Sync (Whitelist Pipeline)

This guide defines a safe, reproducible way to sync multiple external skill sources into a local allowlist.

## Goal

Sync from multiple repositories in one pass, then split into:

- `external/skills-whitelist/` (allowed at runtime)
- `external/skills-quarantine/` (manual review required)
- `external/skills-manifest.json` (traceability report)

## Supported default sources

The sync script reads these local paths:

- `external/anthropics-skills/skills`
- `external/openai-skills/skills/.curated`
- `external/openai-skills/skills/.system`
- `external/microsoft-skills/.github/skills`

Optional additional source (for downloaded archives):

- `SKILLS_MAIN_DIR=<absolute-path>`

Example:

```bash
SKILLS_MAIN_DIR="C:/Users/BoHuYeShan/Downloads/skills-main" bun run skills:sync
```

## Run

Dry-run:

```bash
bun run skills:sync --dry-run
```

Write output:

```bash
bun run skills:sync
```

## Decision model

Each skill is classified as one of:

- `allow`: copied to `skills-whitelist`
- `review`: copied to `skills-quarantine`
- `deny`: skipped

Current default rules:

1. Missing license file => `review`
2. Restrictive license text (`all rights reserved`, `no derivative`, `may not copy/distribute`) => `deny`
3. License text matching MIT/Apache => `allow`
4. Anthropic document skills (`docx`, `pdf`, `pptx`, `xlsx`) => forced `deny`

## Runtime loading

Use `skills.sources` to load only the allowlist output.

```jsonc
{
  "skills": {
    "sources": [
      { "path": "./external/skills-whitelist", "recursive": true }
    ]
  }
}
```

## Important loader constraints

- `skills.sources` currently loads local filesystem paths.
- HTTP/HTTPS sources are ignored by runtime source discovery.
- Hidden folders can be skipped by directory traversal in some paths, so source roots must be explicit (especially OpenAI `.curated/.system` and Microsoft `.github/skills`).

## Compliance notes

Before enabling any newly synced source in production profiles:

1. Record source + commit + path + license in `external/skills-manifest.json`
2. Update `THIRD_PARTY_NOTICES.md` for redistributed content
3. Keep restricted-license skills in deny/quarantine only
