import type { BuiltinSkill } from "../types"

export const structuralBiologySkill: BuiltinSkill = {
  name: "structural-biology",
  description: "Structure retrieval and confidence-aware AlphaFold-style interpretation for protein questions",
  metadata: {
    category: "research/structural-biology",
    domain: "protein-structure",
  },
  // agent: "bio-pipeline-operator",
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

## Workflow

1. choose structure source:
- experimental structure if available
- AlphaFold DB for known proteins
- separate prediction workflow for novel sequences

2. retrieve:
- coordinates
- confidence JSON
- PAE JSON

3. inspect confidence before interpretation.

4. map sequence, domain, mutation, or site hypotheses onto the structure.

## Confidence rules

- pLDDT > 90: very high local confidence
- 70-90: useful backbone confidence
- 50-70: low confidence
- < 50: likely disorder or unreliable local structure
- PAE < 5 A: confident relative positioning
- PAE 5-15 A: moderate uncertainty
- PAE > 15 A: domain orientation may be unreliable

## Hard rules

- do not treat every AlphaFold region as equally reliable
- review PAE before claiming domain orientation is trustworthy
- check residue numbering before mutation interpretation
- if you need functional labeling, pair with \`functional-annotation\`

## Expected artifacts

- \`results/structures/AF-<accession>.cif\`
- \`results/structures/AF-<accession>.pdb\`
- \`results/confidence/AF-<accession>-confidence.json\`
- \`results/confidence/AF-<accession>-pae.json\`
- \`figures/AF-<accession>-pae.png\``,
}
