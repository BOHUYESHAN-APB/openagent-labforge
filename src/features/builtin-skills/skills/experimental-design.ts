import type { BuiltinSkill } from "../types"

export const experimentalDesignSkill: BuiltinSkill = {
  name: "experimental-design",
  description: "Experimental power analysis, replicate planning, batch design, and confounder checks for sequencing and omics studies",
  license: "MIT",
  metadata: {
    category: "research/bioinformatics-experimental-design",
    domain: "bioinformatics",
    imported_from: "GPTomics/bioSkills",
    source_category: "experimental-design",
  },
  // agent: "bio-methodologist",
  allowedTools: ["Read(*)", "WebFetch(*)", "Bash(Rscript:*)", "Bash(python:*)", "Bash(*)"],
  template: `# Experimental Design

Use this skill before execution when the task is deciding sample size, replicate structure, batches, contrasts, or statistical power.

## Mandatory workflow

1. State the biological question and primary endpoint.
2. Define assay type:
- bulk RNA-seq
- single-cell
- ATAC/ChIP
- proteomics/metabolomics
- clinical or mixed-modality study
3. Audit design variables:
- group labels
- batch variables
- paired or repeated measures
- known confounders
- missing metadata
4. Decide whether the design supports inference or only exploratory analysis.
5. Produce the execution handoff:
- required sample table
- design formula or contrast table
- power assumptions
- stop/go risks

## Power and sample-size rules

- Use conservative effect sizes and realistic biological variability.
- Human cohorts usually need wider uncertainty bounds than cell lines or inbred models.
- If sample size is too small for formal inference, say so explicitly and downgrade claims.
- For RNA-seq style power analysis, record expected fold change, CV/dispersion, depth, alpha, and target power before computing anything.

## Batch and contrast rules

- Never allow condition to be perfectly confounded with batch without flagging it as a blocker.
- Make paired designs explicit in both metadata and model formula.
- Prefer balanced allocation across runs, lanes, plates, or donors.
- Separate primary contrasts from exploratory subgroup analyses.

## Suggested implementation patterns

\`\`\`r
library(RNASeqPower)

# Example: power for RNA-seq style differential analysis
rnapower(depth = 20, n = 4, cv = 0.4, effect = 2, alpha = 0.05)
\`\`\`

\`\`\`text
condition + batch
~ donor + condition
\`\`\`

## Deliverables

- study framing and endpoint definition
- required metadata fields
- design matrix or contrast definition
- power assumptions and caveats
- QC blockers that would invalidate the study
- handoff for execution-stage pipeline work
`,
}
