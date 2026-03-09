# Upstream Publish Workflow Notes

This repository is currently standardized for **local build + local install** use first.
Formal npm publishing is deferred.

## Why this file exists

The upstream repository added several publish-related fixes that are relevant when we later restore official npm publishing:

- `adaeaca` — add `NODE_AUTH_TOKEN` to `publish-main` job for npm auth
- `63ed7a5` — update repository URLs to `oh-my-openagent` for npm provenance
- `e244403` — publish both `oh-my-opencode` and `oh-my-openagent` simultaneously

## Current Labforge policy

- Do **not** treat npm publishing as the current release target.
- Prefer reproducible local build / local install instructions.
- Keep these upstream workflow notes for later reference when restoring formal release automation.

## Future release checklist

Before enabling formal npm publishing again:

1. Reconcile package names for core + platform packages
2. Verify npm auth strategy (`NODE_AUTH_TOKEN` / Trusted Publishing)
3. Verify repository URLs for provenance
4. Decide whether dual-publish compatibility is still needed
5. Re-run full release dry-run on CI
