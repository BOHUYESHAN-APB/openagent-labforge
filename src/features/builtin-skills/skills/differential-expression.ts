import type { BuiltinSkill } from "../types"

export const differentialExpressionSkill: BuiltinSkill = {
  name: "differential-expression",
  description: "Count-aware bulk transcriptomics differential expression with design checks, contrasts, and result exports",
  metadata: {
    category: "research/bulk-rna-differential-expression",
    domain: "bioinformatics",
  },
  agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(Rscript:*)", "Bash(*)"],
  template: `# Differential Expression

Use this skill for bulk RNA-seq or count-matrix differential expression.

## Preferred tools

- Python: PyDESeq2, pandas, numpy, matplotlib
- R alternative: DESeq2 / edgeR when the environment already uses R

## When to use

- raw count matrix exists
- sample metadata exists
- the user needs contrasts, ranked genes, or pathway-ready outputs

## Mandatory checks

1. Verify counts are raw integers, not TPM/FPKM.
2. Check replicate counts and batch balance.
3. Identify confounded variables before fitting a model.
4. Make the contrast explicit.

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

## Expected artifacts

- \`results/de_results.tsv\`
- \`results/de_significant.tsv\`
- \`results/de_ranked_genes.tsv\`
- \`figures/volcano.pdf\`
- \`figures/ma_plot.pdf\`
- \`qc/sample_pca.pdf\`

## Quality rules

- Report the full table and thresholded table.
- Use effect size and adjusted p-value together.
- Do not oversell results from very low replicate counts.
- Call out if the design is too weak for strong claims.
`,
}
