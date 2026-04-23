import type { BuiltinSkill } from "../types"

export const vectorDesignSkill: BuiltinSkill = {
  name: "vector-design",
  description: "Vector, plasmid, and construct design guidance using open-source and optional commercial tooling",
  metadata: {
    category: "research/vector-and-construct-design",
    domain: "vector-design",
  },
  // agent: "wet-lab-designer",
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

- if a commercial tool is required, state that clearly and describe the open-source fallback where possible
- if the workflow can be executed with open tools, prefer the reproducible open path first
- when using BLAST or domain checks for construct validation, record the database or reference used

## Design checklist

- vector backbone and size constraints
- insert / cassette / marker layout
- promoter / coding sequence / tag / linker ordering
- cloning or assembly strategy
- primer strategy
- restriction / homology / overlap logic
- sequence validation plan
- downstream assay compatibility

## Validation workflow

1. define the biological objective and expression or editing system
2. choose backbone and assembly strategy
3. verify inserts, junctions, and orientation in silico
4. check restriction and primer logic
5. define the sequencing or colony-screening confirmation plan

## Hard rules

- never claim a construct is valid without sequence-level validation logic
- distinguish in-silico design from wet-lab confirmation
- be explicit about what the user must do in external GUI software if a non-scriptable step is unavoidable
- if constructs drive a downstream assay, state which elements are mandatory versus optional`,
}
