import type { BuiltinSkill } from "../types"

export const differentialExpressionSkill: BuiltinSkill = {
  name: "differential-expression",
  description: "Count-aware bulk transcriptomics differential expression with design checks, contrasts, and result exports",
  metadata: {
    category: "research/bulk-rna-differential-expression",
    domain: "bioinformatics",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(Rscript:*)", "Bash(*)"],
  template: `# Differential Expression

Use this skill for count-aware bulk transcriptomics differential expression.

## Quick route

- no replicates: do not pretend formal DE is strong
- 2 replicates per group: possible but conservative
- 3 or more replicates per group: standard starting point

## Preferred tools

- Python: PyDESeq2, pandas, numpy, matplotlib
- R alternative: DESeq2 / edgeR when the project already uses R

## Mandatory checks

1. Verify counts are raw integers, not TPM/FPKM.
2. Check replicate counts, batch balance, and pairing structure.
3. Identify confounded variables before fitting a model.
4. Make the contrast explicit.
5. Record the design formula and why it is valid.

## Starter pattern

\`\`\`python
from pydeseq2.dds import DeseqDataSet
from pydeseq2.ds import DeseqStats

dds = DeseqDataSet(
    counts=counts_df,
    metadata=metadata_df,
    design_factors=["condition", "batch"],
)
dds.deseq2()
stats = DeseqStats(dds, contrast=("condition", "treated", "control"))
stats.summary()
res = stats.results_df.sort_values("padj")
res.to_csv("results/de_results.tsv", sep="\\t")
\`\`\`

## Workflow

1. Validate design:
- replicate counts
- factor levels
- batch balance
- paired or blocked structure
- missing metadata joins

2. Fit a count-aware model.

3. Export both full and thresholded outputs.

4. Generate at least:
- sample PCA
- volcano plot
- MA plot

5. Export a ranked gene table for pathway or enrichment follow-up.

## Expected artifacts

- \`results/de_results.tsv\`
- \`results/de_significant.tsv\`
- \`results/de_ranked_genes.tsv\`
- \`figures/volcano.pdf\`
- \`figures/ma_plot.pdf\`
- \`qc/sample_pca.pdf\`
- \`qc/design_check.tsv\`

## Quality rules

- report the full table and thresholded table
- use effect size and adjusted p-value together
- do not oversell results from weak replicate counts
- if design is confounded or underpowered, say the inference is weak
- use raw counts only for the model-fitting stage

## Anti-patterns

- fitting count-based DE on TPM as if it were raw counts
- omitting obvious batch or pairing terms
- showing only significant hits and hiding the full table
- using p-value without effect size`,
}
