# MCP + Skills Audit (2026-03-08)

This audit summarizes repositories explicitly requested for validation.

## 1) MCP repositories

| Repo | License | Key requirement | Activity | Recommendation |
|---|---|---|---|---|
| `openags/paper-search-mcp` | MIT | Optional (depends on selected source/tool path) | 2025-08-25 last push | Candidate (phase-2) |
| `zongmin-yu/semantic-scholar-fastmcp-mcp-server` | MIT | Optional but practical API key recommended for quota | 2026-01-16 last push | Candidate (phase-2) |
| `hhx465453939/mcp-pubmed-server` | **Conflict** (repo metadata Apache-2.0 vs package metadata MIT) | Yes (required env in docs) | 2026-02-19 last push | Defer until license inconsistency resolved |
| `yan5236/bing-cn-mcp-server` | MIT | No | 2026-01-07 last push | Candidate (region-aware, optional enable) |

## 2) Skills repositories

| Repo | Local clone status | License posture | Format compatibility | Recommendation |
|---|---|---|---|---|
| `anthropics/skills` | Cloned (`external/anthropics-skills`) | Mixed per-skill licensing | High (`SKILL.md` frontmatter/spec) | Reference-only with per-skill license filter |
| `openai/skills` | Cloned (`external/openai-skills`) | Per-skill licenses (`LICENSE.txt` pattern) | High (`SKILL.md` + agent metadata) | Preferred reference source |
| `microsoft/skills` | Cloned (`external/microsoft-skills`) | MIT repo-level | High (`SKILL.md` + command markdown patterns) | Preferred reference source |
| `openclaw/skills` | Clone failed (network reset) | MIT repo-level (remote evidence) | Medium (archive-style, trust variability) | Reference-only after security filtering |

## 3) Policy decisions applied

1. No-key-first strategy remains active for default integrations.
2. Google-dependent paths are not default-on in restricted/uncertain network profiles.
3. Any MCP with unclear license/key requirements is deferred by default.

## 4) Next implementation gate

Before enabling in default profile:
- add verified matrix entry in `THIRD_PARTY_NOTICES.md`
- add candidate intake in `plugins/opencode-mcp-paper-search/MCP_CANDIDATES.md`
- add usage constraints (trust boundary + network gating behavior)
