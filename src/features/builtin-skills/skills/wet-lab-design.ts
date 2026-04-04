import type { BuiltinSkill } from "../types"

export const wetLabDesignSkill: BuiltinSkill = {
  name: "wet-lab-design",
  description: "Wet-lab validation design for user-executed experiments, including controls, replicates, and assay selection",
  metadata: {
    category: "research/wet-lab-validation-design",
    domain: "wet-lab",
  },
  agent: "wet-lab-designer",
  allowedTools: ["Read(*)", "WebFetch(*)", "Bash(python:*)"],
  template: `# Wet-Lab Validation Design

Use this skill when computational results need a user-run experimental validation plan.

## What this skill covers

- assay selection
- positive / negative / technical controls
- replicate strategy
- expected readouts
- interpretation and failure criteria
- handoff requirements for downstream computational analysis

## Typical assay families

- qPCR / RT-qPCR
- western blot / ELISA
- flow cytometry
- CRISPR perturbation validation
- reporter assays
- microscopy / imaging readouts
- co-IP / pulldown / interaction validation

## Hard rules

- This skill designs experiments; it does not claim they were performed.
- Always define what result would support, weaken, or falsify the hypothesis.
- Prefer practical experimental choices the user can actually execute.
- Include biosafety, sample access, and instrumentation constraints when they materially affect feasibility.

## Output contract

- objective
- system and materials
- controls
- replicates
- execution outline
- readouts
- interpretation rules
- follow-up data expected back from the lab
`,
}
