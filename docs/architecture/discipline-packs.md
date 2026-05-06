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
