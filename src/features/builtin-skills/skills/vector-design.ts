import type { BuiltinSkill } from "../types"

export const vectorDesignSkill: BuiltinSkill = {
  name: "vector-design",
  description: "Vector, plasmid, and construct design guidance using open-source and optional commercial tooling",
  metadata: {
    category: "research/vector-and-construct-design",
    domain: "vector-design",
  },
  agent: "wet-lab-designer",
  allowedTools: ["Read(*)", "WebFetch(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Vector And Construct Design

Use this skill when the task involves plasmids, vectors, cloning strategies, cassette layout, guide placement, primers, or construct validation.

## Typical tool options

Open-source / scriptable:
- BioPython
- pydna
- primer3 / primer3-py
- BLAST+
- HMMER
- restriction / sequence utilities

Commercial or semi-commercial tools that may appear in real workflows:
- SnapGene
- Geneious
- Benchling

## Usage policy

- If a commercial tool is required, state that clearly and describe the open-source fallback where possible.
- If the workflow can be executed with open tools, prefer the reproducible open path first.
- When using BLAST/domain checks for construct validation, record the database/reference used.

## Design checklist

- vector backbone and size constraints
- insert / cassette / marker layout
- cloning or assembly strategy
- primer strategy
- restriction / homology / overlap logic
- sequence validation plan
- downstream assay compatibility

## Hard rules

- Never claim a construct is valid without sequence-level validation logic.
- Distinguish in-silico design from wet-lab confirmation.
- Be explicit about what the user must do in external GUI software if a non-scriptable step is unavoidable.
`,
}
