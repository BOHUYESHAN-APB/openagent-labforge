# Discipline Packs

LabForge started with strong bioinformatics support, but the long-term design is
not “bio-only.” Bio should become the first discipline pack in a general
discipline system.

Chinese version: [`discipline-packs.zh-CN.md`](discipline-packs.zh-CN.md)

## Why this matters

The current GitHub repository name `openagent-labforge-bio` is historical. It
should not force every future LabForge installation to be bioinformatics-first.

The target model is:

```text
LabForge core
  + engineering workflow
  + host adapters
  + optional discipline packs
```

## First discipline pack: bio

Bio remains important and should stay compatible with current users.

Current bio assets include:

- `bio-analyst` display name for internal `bio-orchestrator`;
- bundled `resources/bioSkills` catalog;
- `detect_bio_task` and `load_bio_skills` tools;
- bio-focused MCP recommendations;
- figure QA and script-hygiene requirements for bio workflows.

Future work should move these behind a discipline-pack boundary without breaking
existing `openagent-labforge-bio` users.

### Current direction for bio

The next priority is not to keep bio-analyst narrow. The bio specialist should
grow from a bioinformatics-heavy executor into a broader biological science
expert that can:

- frame biological questions and hypotheses;
- design experiments and validation strategies;
- reason about controls, confounders, batches, power, and effect sizes;
- interpret results and propose next-step studies;
- call specialist modules such as chemistry or statistics when needed, then pull
  those results back into one biological conclusion.

In other words, bio remains the current science lead. Other expert modules can be
added gradually, but they should eventually feed back into the mature biological
expert instead of permanently fragmenting the workflow.

## Future discipline pack shape

```ts
interface DisciplinePack {
  id: 'bio' | 'chemistry' | 'materials' | 'physics' | 'math';
  displayName: string;
  agents: unknown[];
  skills: unknown[];
  commands: unknown[];
  mcps?: unknown[];
  defaultEnabled: boolean;
}
```

The exact TypeScript interface can be refined later. The important design rule is
that new disciplines should not require hardcoding another special case into the
OpenCode plugin entrypoint.

## Repository rename plan

Before renaming the GitHub repository from `openagent-labforge-bio` to
`extendai-lab`, confirm:

1. docs say bio is a discipline pack, not the whole product;
2. package metadata points to the final repository name;
3. install examples no longer require `-bio` paths;
4. GitHub redirects are acceptable for existing release/tag links;
5. release automation uses the new remote;
6. the old name remains documented as historical compatibility.

Until then, use `origin-bio` only because it is the current correct remote.

## Minimal chemistry migration

The first chemistry step is intentionally small:

- add a chemistry-facing primary agent entrypoint;
- keep it focused on chemoinformatics and chemistry-heavy bio overlap;
- reuse the existing `load_bio_skills(categories=["chemoinformatics"])` path;
- avoid creating a second loader or a parallel chemistry skill registry.

This keeps the chemistry pack useful for protein/ligand/structure-heavy bio work
without pretending LabForge already has a full standalone chemistry platform.

The chemistry overlap layer should therefore support the bio expert first, not
replace it. Chemistry-heavy subproblems should currently be handled through the
existing chemoinformatics skills, while the primary biological question,
interpretation, and study strategy should still be owned by `bio-analyst` when
the task is fundamentally biological.

## Prompt-design rule for expert agents

Expert prompts should have a disciplinary bias, but not a rigid identity lock.
Large models should not be over-forced into acting like a single narrow expert
when the real bottleneck is elsewhere.

Design rule:

- give each expert a default scientific lens;
- state what that expert should notice first;
- state which skills/tools it should load first;
- also state when it must admit the task is really chemistry, statistics,
  software, or broader research design and route accordingly.
