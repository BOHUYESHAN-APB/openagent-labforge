# Licensing & Attribution Guide

This repository contains mixed provenance:

1. Upstream-derived code (from openagent-labforge / openagent-labforge lineage, with original upstream descriptions retained where appropriate)
2. New repository additions (workflows/docs/features by this derivative project)
3. Third-party integrations (especially MCP servers)

## Canonical Files

- `LICENSE.md` — root license text and baseline terms
- `NOTICE` — provenance attribution summary
- `THIRD_PARTY_NOTICES.md` — third-party matrix and MCP intake status
- `external/skills-manifest.json` — external skills intake ledger (allow/review/deny)

## How to add a new third-party MCP

1. Fill `plugins/opencode-mcp-paper-search/MCP_CANDIDATES.md` for the candidate.
2. Verify upstream repository license and key requirement from source docs.
3. Update `THIRD_PARTY_NOTICES.md` matrix row.
4. Add usage constraints (trust boundary, data egress, fallback behavior).

## Required fields for every integration

- component name
- source URL
- upstream repository URL
- license (SPDX-like identifier)
- key requirement (`Yes/No/Optional/Unknown`)
- network dependency type
- status (`candidate / priority / defer / reject`)
- usage constraints

## Policy defaults

- Prefer permissive licenses: MIT / Apache-2.0 / BSD / ISC.
- Unknown license or unclear terms → defer.
- Unknown key requirement → no default enablement.
- Google-dependent retrieval tools require network-aware gating and explicit opt-in.

## External skills (SKILL.md bundles)

External skills are stored under `external/*` with attribution recorded in:

- `external/skills-manifest.json` (license decision + hashes)
- `THIRD_PARTY_NOTICES.md` (source provenance summary)

