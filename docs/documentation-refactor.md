# Documentation Refactor Plan

ExtendAI Lab started from OMO / oh-my-openagent and
oh-my-opencode-slim ideas, but it now has its own command prefix, runtime
storage layout, bioinformatics features, media QA tools, and plan workflow. Some
documentation still uses inherited names or concepts. This page tracks the
target structure for bringing docs in line with the current design.

## Current principles

1. **Use current product names.** Public docs should say ExtendAI Lab, not
   oh-my-opencode-slim, unless explicitly discussing upstream lineage.
2. **Use the `ol-` command prefix for LabForge commands.** Do not document new
   workflow usage as `/start-work`; use `/ol-start-work`. Prefer prefixed
   utility commands such as `/ol-preset`, `/ol-auto-continue`, and
   `/ol-interview` to avoid collisions with other plugins.
3. **Separate configuration from guidance.** `/ol-preset` changes runtime
   model/provider configuration; `/ol-karpathy` injects task behavior guidance.
4. **Keep plugin-owned files under plugin-owned paths.** Project state belongs
   under `.opencode/extendai-lab/`; global logs/data belong under the
   OpenCode data directory’s `extendai-lab/` subfolder.
5. **Document actual implementation, not upstream aspiration.** If a behavior is
   inherited from OMO but implemented differently here, describe the LabForge
   behavior first and mention OMO only as lineage.
6. **Separate host docs.** OpenCode is a full plugin host; DeepSeek-TUI is a
   file/MCP/skill adapter target. Do not mix the two in one runtime guide.
7. **Treat bio as a discipline pack.** The `openagent-labforge-bio` repository
   name is historical; future docs should describe bio as the first optional
   discipline pack.

## Target information architecture

| Area | Target doc | Status |
|------|------------|--------|
| Command taxonomy | [`commands.md`](commands.md) | Added; documents prompt-template vs hook-driven commands and `/ol-preset` vs `/ol-karpathy`. |
| Plan execution | [`plan-workflow.md`](plan-workflow.md) | Added; documents planner plans, `/ol-start-work`, executor behavior, boulder, and council. |
| Runtime presets | [`preset-switching.md`](preset-switching.md) | Partially updated; still needs examples aligned with LabForge config defaults. |
| Skills | [`skills.md`](skills.md) | Partially updated; now includes `karpathy-guidelines`. |
| Installation | [`installation.md`](installation.md) | Rewritten to the current source-build / release workflow, but still needs broader host-specific examples. |
| OpenCode host | [`opencode/README.md`](opencode/README.md) | Added; separates OpenCode full plugin behavior from adapter docs. |
| DeepSeek-TUI host | [`deepseek-tui/README.md`](deepseek-tui/README.md) | Added; documents DSTUI as file/MCP/skill adapter target, not plugin host. |
| Adapter architecture | [`architecture/adapters.md`](architecture/adapters.md) | Added; documents TypeScript/Node-compatible direction and host boundaries. |
| Discipline packs | [`architecture/discipline-packs.md`](architecture/discipline-packs.md) | Added; tracks bio-to-pack migration and future science packs. |
| Engineering modules | `architecture/engineering-modules.md` + `engineering-modules/*` | Added; standardizes reusable prompt-discipline docs before staged injection/runtime loading. |
| Repository rename | [`architecture/repository-rename.md`](architecture/repository-rename.md) | Added; tracks `openagent-labforge-bio` to `extendai-lab` migration. |
| Configuration | [`configuration.md`](configuration.md) | Needs name/path cleanup and current schema alignment. |
| MCPs | [`mcps.md`](mcps.md) and [`storage-and-mcp.md`](storage-and-mcp.md) | Needs LabForge bio MCP and project-local MCP path alignment. |
| Visual/media QA | README + future dedicated doc | Needs dedicated doc when SVG/browser-rendered visual QA lands. |
| Bioinformatics workflow | future `bio-workflows.md` | Needed for bioSkills, BioMCPs, generated figures, and script hygiene. |

## Known inherited wording to clean up

- Remaining inherited `oh-my-opencode-slim` package/config names in configuration,
  interview, multiplexer, MCP, maintainer, council, and codemap docs.
- OMO/Sisyphus names where ExtendAI Lab now uses friendly names such as
  engineer, planner, executor, and `.opencode/extendai-lab/` paths.
- Legacy `/start-work` references; use `/ol-start-work` in user-facing docs.
- Skill docs that list only `simplify` and `codemap`; include
  `karpathy-guidelines` and media/browser skills where relevant.
- Examples that imply generated packages or old npm names are the recommended
  install path; current production path is source build / source-only GitHub
  releases.
- Repository URLs that still point at `openagent-labforge-bio` without noting
  the historical naming context.

## Recommended refactor order

1. **Command and plan docs** — unblock user-facing workflow confusion.
2. **README overview** — ensure the landing page reflects current LabForge
   features and not inherited OMO/Slim assumptions.
3. **Installation/configuration** — fix package names, config paths, release
   model, and source-build workflow.
4. **Skills/MCPs/bio docs** — align with bundled skills, bioSkills, and
   project-local MCP storage.
5. **Advanced workflows** — visual QA, SVG QA, bio figure QA, script hygiene,
   council usage, and multi-agent plan execution.
6. **Host adapter docs** — maintain OpenCode and DeepSeek-TUI docs separately;
   DeepSeek-TUI docs should never imply full runtime plugin parity.

## Review rule

Any future docs change should answer:

- Is this describing LabForge’s current implementation?
- Is it using the correct command prefix and file path?
- Does it distinguish runtime configuration (`/ol-preset`) from behavioral guidance
  (`/ol-karpathy`, skills, prompts)?
- Does it avoid promising OMO behavior that has not been ported?
