import type { BuiltinSkill } from "../types"

export const wetLabDesignSkill: BuiltinSkill = {
  name: "wet-lab-design",
  description: "Wet-lab validation design for user-executed experiments, including controls, replicates, and assay selection",
  metadata: {
    category: "research/wet-lab-validation-design",
    domain: "wet-lab",
  },
  // agent: "wet-lab-designer",
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

## Design workflow

1. state the hypothesis and what exact result would support it
2. choose the minimum practical assay that can test it
3. define:
- biological system
- materials or constructs
- controls
- replicates
- measurement readout
4. define failure or falsification criteria
5. specify what data should come back for computational follow-up

## Hard rules

- this skill designs experiments; it does not claim they were performed
- always define what result would support, weaken, or falsify the hypothesis
- prefer practical experimental choices the user can actually execute
- include biosafety, sample access, instrumentation, and turnaround constraints when they materially affect feasibility
- if the design depends on constructs or primers, pair with \`vector-design\`

## Output contract

- objective
- hypothesis
- system and materials
- controls
- replicates
- execution outline
- readouts
- interpretation rules
- follow-up data expected back from the lab`,
}
