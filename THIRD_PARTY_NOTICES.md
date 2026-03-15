# Third-Party Notices

Last updated: 2026-03-08

## 1) Upstream Derivation (Provenance)

This repository is a derivative work based on:

- Upstream: `code-yeongyu/oh-my-openagent` (formerly `oh-my-opencode`)
- Repository: https://github.com/code-yeongyu/oh-my-openagent
- Upstream license context: Sustainable Use License 1.0 (SUL-1.0)

Status:
- Fork/derivative with additional features and behavior changes.

Non-exhaustive derivative changes:
- Restored lightweight default `plan`/`build` behavior and added orchestration toggles.
- Added Model Governor AUTO discovery/category/fallback features.
- Added i18n display-name controls and SOUL rule injection controls.
- Added built-in document/research skills and bio/paper workflow scaffolding.

## 2) License Boundary Statement

To avoid ambiguity:

1. Upstream-derived portions remain subject to upstream license terms.
2. Third-party components/integrations retain their own original licenses.
3. New documentation/configuration/orchestration additions in this repository are managed under this repository's declared licensing boundary and attribution records.

For operational attribution context, also see:
- `LICENSE.md`
- `NOTICE`
- `docs/licensing.md`

## 3) External Skills Sources

- Auto-claude research skills
  - Repository: https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep
  - License: MIT (see `external/auto-claude-skills/LICENSE`)
  - Local mirror: `external/auto-claude-skills`

## 4) Third-Party MCP / Integration Matrix

The following matrix is used as engineering attribution + intake tracking.
Entries may be `Unknown` until verified from upstream repository sources.

| Component | Source | Upstream Repo | License | API Key Required | Network Dependency | Integration Status | Usage Constraints |
|---|---|---|---|---|---|---|---|
| paper-search-mcp | ModelScope / OSS registry | `openags/paper-search-mcp` | MIT (verified) | Unknown/partial | Multi-source (arXiv/PubMed/Scholar etc.) | candidate | Disable any non-compliant retrieval paths by default |
| arxiv-mcp-server | ModelScope / OSS registry | `blazickjp/arxiv-mcp-server` | Apache-2.0 (verified) | No (core), optional features may vary | arXiv | candidate-priority | Keep local storage bounds and provenance logs |
| semantic-scholar-fastmcp-mcp-server | ModelScope / OSS registry | `zongmin-yu/semantic-scholar-fastmcp-mcp-server` | MIT (verified) | Usually yes for full quota | Semantic Scholar | candidate | Rate-limit and key-presence fallback needed |
| server-puppeteer | ModelScope / npm | `@modelcontextprotocol/server-puppeteer` | MIT (verified) | No | Browser automation | candidate-priority | Treat as high-trust-boundary tool; strict domain/URL policy |
| Fetch-Browser | ModelScope / OSS registry | `TheSethRose/Fetch-Browser` | MIT (verified) | No | Browser + Google scraping path | candidate-priority | Network-aware gating required for Google-dependent paths |

## 4) Intake and Verification Rule

Before enabling any MCP in default profiles:

1. Complete `docs/guide/mcp-license-checklist.md`.
2. Add/refresh candidate record in `plugins/opencode-mcp-paper-search/MCP_CANDIDATES.md`.
3. Update this notice matrix with verified fields.
4. If license or key requirement cannot be verified, keep status as `defer`.
