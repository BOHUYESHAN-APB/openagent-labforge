import type { BuiltinSkill } from "../types"

export const literatureSynthesisSkill: BuiltinSkill = {
  name: "literature-synthesis",
  description: "Long-horizon literature review and survey workflow for reading, weighting, clustering, and writing from large paper corpora",
  metadata: {
    category: "writing/literature-synthesis",
    domain: "literature-synthesis",
  },
  // agent: "scientific-writer",
  allowedTools: ["Read(*)", "WebFetch(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Literature Synthesis

Use this skill when the task involves:
- reading many papers
- review writing
- survey writing
- long-form evidence synthesis
- abstract or summary writing built on a large corpus

## Corpus rule

Do not jump straight to writing if the task implies a large reading load.

First define:
- target paper count
- search buckets
- inclusion criteria
- exclusion criteria
- weighting rules
- synthesis checkpoints

## Source weighting

Default weighting:
- peer-reviewed / formally published papers: highest weight
- conference papers and journal articles with stable publication metadata: high weight
- arXiv and other preprints: lower default weight unless uniquely necessary

Do not hide the difference between published work and preprints.

## Workflow

1. Build a corpus ledger.
2. Group papers by theme, method, dataset, or claim type.
3. Extract:
- core claim
- method
- evidence
- limitations
- relevance
- publication status

4. Synthesize in waves for large corpora:
- 10-20 papers -> checkpoint summary
- 20-50 papers -> theme clustering
- 50-100+ papers -> contradiction map and gap analysis

5. Only after synthesis should you write:
- review
- survey
- abstract
- summary section

## Required outputs

- corpus table
- source weighting note
- theme clusters
- contradiction map
- gap analysis
- final written synthesis

## Anti-AI rules

- do not write a \"survey\" from a shallow skim
- do not flatten disagreement across papers into false consensus
- do not over-weight preprints without saying so
- do not produce long generic summaries without a corpus structure

## Output contract

- corpus scope
- weighting policy
- synthesis checkpoints
- final narrative grounded in the corpus rather than in generic topic prose`,
}
