import type { BuiltinSkill } from "../types"

export const proposalAndRoadmapSkill: BuiltinSkill = {
  name: "proposal-and-roadmap",
  description: "Structured business plans, project plans, proposals, and long-horizon roadmaps with concrete milestones, risks, resources, and decision gates",
  metadata: {
    category: "writing/proposal-and-roadmap",
    domain: "proposal-roadmap-writing",
  },
  agent: "article-writer",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Proposal And Roadmap

Use this skill for:
- business plans
- project plans
- stakeholder-facing proposals
- implementation roadmaps
- long-term strategy documents
- phased execution memos

## Core rule

These documents are not essays. They are decision documents.

Write them around:
- objective
- scope
- deliverables
- milestones
- owners or resource assumptions
- risks
- decision gates
- what is intentionally deferred

## Required workflow

1. classify the document type:
- business plan
- project plan
- roadmap
- proposal
- strategy memo

2. define the audience:
- investors
- management
- collaborators
- technical stakeholders
- cross-functional delivery team

3. lock the section structure before drafting.

4. for long-horizon work, include explicit planning horizons such as:
- now
- next
- later
or:
- phase 1
- phase 2
- phase 3

5. convert vague ambition into operational structure:
- milestones
- dependencies
- resource assumptions
- review cadence
- exit criteria

## Companion skills

- load \`doc-coauthoring\` when the proposal or roadmap will be revised across multiple collaborative passes
- load \`internal-comms\` when the output is mainly for internal alignment instead of external persuasion
- load \`brand-guidelines\` when the proposal must match a defined organizational voice or presentation system

## Anti-AI rules

Reject wording that is mostly slogans, aspiration, or empty management language.

Avoid generic filler such as:
- empower
- synergy
- comprehensive upgrade
- continuously improve
- closed loop construction

unless they are backed by concrete execution detail.

## Output contract

- document type
- audience
- section outline
- milestone structure
- risk / mitigation table
- decision gates
- open questions
- self-review notes on vagueness, missing numbers, and missing ownership`,
}
