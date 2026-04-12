# Third-Party Notices

Last updated: 2026-03-25

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

## 3) Third-Party Skill Derivations

The following skill content is adapted from third-party repositories and integrated
into OpenAgent Labforge built-in skills with repo-specific routing, agent ownership,
and allowed-tool metadata.

- Source: `GPTomics/bioSkills`
- Repository: https://github.com/GPTomics/bioSkills
- License: MIT (verified from upstream LICENSE snapshot inspected on 2026-04-12)
- Integration status: full file-backed bundle generation for the upstream bioSkills tree, plus selectively inlined built-in adaptations
- Adapted and generated coverage in this repository:
  - file-backed `generated/skills-bundles/bio` bundle generated from the upstream bioSkills tree when the source checkout is available
  - category-first routing over upstream bio categories and detailed leaf skills
  - selected inlined built-in adaptations:
    - `experimental-design`
    - `read-qc`
    - `read-alignment`
    - `rna-quantification`
    - `pathway-analysis`
    - `variant-calling`
    - `genome-annotation`
    - `workflow-management`
    - `reporting`
    - `genome-intervals`

Integration notes:
- Upstream leaf skills are carried as file-backed skills for lazy loading and path-preserving references.
- Discovery is intentionally category-first so leaf skills do not flood the global skill list.
- Built-in Labforge bio skills are also exposed through generated category wrappers to participate in the same routing flow.

## 4) Third-Party MCP and Integration Register

The following register is maintained as an engineering attribution, intake,
and review record for bundled, referenced, or installer-supported third-party
MCP servers and adjacent integrations.

Unless noted otherwise, entries describe upstream projects that are invoked by
configuration or runtime integration and are not relicensed by this repository.
Fields may remain `Unknown` until verified from upstream repository sources.

| Component | Source | Upstream Repo | License | API Key Required | Network Dependency | Integration Status | Usage Constraints |
|---|---|---|---|---|---|---|---|
| open-websearch | npm / GitHub | `Aas-ee/open-webSearch` | Apache-2.0 (verified) | No for DuckDuckGo/Bing/Baidu baseline; some engines may vary | Multi-engine web search aggregation | integrated-default-off | Run in stdio mode, preserve engine allowlist, and keep fallback to first-party `websearch` for English coverage |
| paper-search-mcp | ModelScope / OSS registry | `openags/paper-search-mcp` | MIT (verified) | Unknown/partial | Multi-source (arXiv/PubMed/Scholar etc.) | candidate | Disable any non-compliant retrieval paths by default |
| arxiv-mcp-server | ModelScope / OSS registry | `blazickjp/arxiv-mcp-server` | Apache-2.0 (verified) | No (core), optional features may vary | arXiv | candidate-priority | Keep local storage bounds and provenance logs |
| semantic-scholar-fastmcp-mcp-server | ModelScope / OSS registry | `zongmin-yu/semantic-scholar-fastmcp-mcp-server` | MIT (verified) | Usually yes for full quota | Semantic Scholar | candidate | Rate-limit and key-presence fallback needed |
| server-puppeteer | ModelScope / npm | `@modelcontextprotocol/server-puppeteer` | MIT (verified) | No | Browser automation | candidate-priority | Treat as high-trust-boundary tool; strict domain/URL policy |
| Fetch-Browser | ModelScope / OSS registry | `TheSethRose/Fetch-Browser` | MIT (verified) | No | Browser + Google scraping path | candidate-priority | Network-aware gating required for Google-dependent paths |

## 5) Intake and Verification Rule

Before enabling any MCP in default profiles or installer-written presets:

1. Complete `docs/guide/mcp-license-checklist.md`.
2. Add/refresh candidate record in `plugins/opencode-mcp-paper-search/MCP_CANDIDATES.md`.
3. Update this notice matrix with verified fields.
4. If license, terms, or key requirements cannot be verified, keep status as `defer`.

## 6) Professional Notice Practice

- Keep component names, upstream repositories, and verified licenses precise.
- Distinguish clearly between `integrated`, `candidate`, and `defer` states.
- Record operational constraints that affect privacy, rate limits, or search provenance.
- Refresh this register whenever a bundled MCP changes name, package, or default routing behavior.
