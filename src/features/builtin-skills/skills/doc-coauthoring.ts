import type { BuiltinSkill } from "../types"

export const docCoauthoringSkill: BuiltinSkill = {
  name: "doc-coauthoring",
  description:
    "Structured long-document collaboration with context capture, staged drafting, reader testing, and revision loops",
  metadata: {
    category: "writing/doc-coauthoring",
    domain: "document-collaboration",
  },
  agent: "article-writer",
  allowedTools: ["Read(*)", "Bash(*)"],
  template: `# Document Coauthoring

Use this skill when:
- drafting a long document with the user
- iterating on PRDs, proposals, whitepapers, or plans
- turning scattered notes into a structured document
- revising documents over multiple checkpoints

## Mission

Treat long-form writing as a collaboration workflow, not a one-shot dump.

## Three-stage workflow

1. Context capture
- gather the user's intent, audience, constraints, and raw material
- identify what is already decided vs. still uncertain
- create a clean outline before drafting

2. Draft and refine
- write section by section
- keep each revision targeted
- prefer precise edits over reprinting the whole document every time
- preserve a running list of open issues, missing evidence, and unresolved claims

3. Reader test
- inspect whether a fresh reader could understand the document without hidden context
- identify ambiguity, missing definitions, and weak transitions
- revise accordingly

## Working rules

- lock document type and audience early
- keep a source ledger for major facts and claims
- separate structure problems from wording problems
- checkpoint long documents instead of stretching one editing pass forever
- use explicit section goals so revisions stay local and controllable

## When to load companion skills

- load \`proposal-and-roadmap\` for plans, proposals, and milestone-heavy documents
- load \`brand-guidelines\` when tone or presentation must follow a visual/brand system
- load \`internal-comms\` when the audience is internal and alignment-sensitive
- load \`document-asset-pipeline\` when diagrams, screenshots, or figures are involved

## Output contract

- document type and audience
- current outline
- section-by-section status
- unresolved issues
- next revision wave
- reader-test findings if performed`,
}
