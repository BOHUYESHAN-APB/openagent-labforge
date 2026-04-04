import type { BuiltinSkill } from "../types"

export const structuralBiologySkill: BuiltinSkill = {
  name: "structural-biology",
  description: "Structure retrieval and confidence-aware AlphaFold-style interpretation for protein questions",
  metadata: {
    category: "research/structural-biology",
    domain: "protein-structure",
  },
  agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "WebFetch(*)", "Bash(*)"],
  template: `# Structural Biology

Use this skill for protein structure retrieval and confidence-aware interpretation.

## Preferred tools

- BioPython PDB / AlphaFold DB helpers
- optional visualization via PyMOL or py3Dmol-compatible workflows

## Typical tasks

- retrieve AlphaFold DB entries
- download coordinates and confidence files
- inspect pLDDT / PAE before making mechanistic claims
- map residues, domains, or mutations onto structure

## Confidence rules

- pLDDT > 90: very high local confidence
- 70-90: useful backbone confidence
- 50-70: low confidence
- < 50: likely disorder or unreliable local structure

## Hard rules

- Do not treat every AlphaFold region as equally reliable.
- Review PAE before claiming domain orientation is trustworthy.
- Check residue numbering before mutation interpretation.
`,
}
