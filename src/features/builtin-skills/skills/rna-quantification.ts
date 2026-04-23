import type { BuiltinSkill } from "../types"

export const rnaQuantificationSkill: BuiltinSkill = {
  name: "rna-quantification",
  description: "Gene or transcript quantification from RNA-seq alignments or pseudoalignment outputs using featureCounts, Salmon, kallisto, and tximport workflows",
  license: "MIT",
  metadata: {
    category: "research/bioinformatics-rna-quantification",
    domain: "bioinformatics",
    imported_from: "GPTomics/bioSkills",
    source_category: "rna-quantification",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(Rscript:*)", "Bash(*)"],
  template: `# RNA Quantification

Use this skill when RNA-seq reads have already been aligned or pseudoaligned and the next task is to produce gene- or transcript-level abundance matrices.

## Decision rules

- Use \`featureCounts\` when you already have BAM files and need gene counts.
- Use \`Salmon\` or \`kallisto\` when pseudoalignment is preferred.
- Use \`tximport\` when transcript-level estimates must be summarized to genes for DESeq2 or edgeR.

## Mandatory workflow

1. Confirm whether the target output is gene-level or transcript-level.
2. Confirm library strandedness.
3. Ensure annotation and reference match the alignment build.
4. Generate count or abundance matrices.
5. Validate sample names, matrix dimensions, and assignment rate.

## Starter commands

\`\`\`bash
featureCounts \
  -T 8 \
  -p --countReadPairs \
  -s 2 \
  -a annotation.gtf \
  -o results/counts.txt \
  align/*.bam
\`\`\`

\`\`\`bash
salmon quant -i salmon_index -l A -1 reads_1.fq.gz -2 reads_2.fq.gz -o quant/sample --threads 8
\`\`\`

\`\`\`r
library(tximport)

txi <- tximport(files, type = "salmon", tx2gene = tx2gene)
\`\`\`

## Validation rules

- Strand setting must match library prep.
- Low assignment rate or many zero-count samples are blockers, not footnotes.
- Keep transcript-to-gene summarization logic explicit.
- Do not merge matrices until sample identifiers are normalized and verified.

## Expected artifacts

- \`results/count_matrix.tsv\`
- \`results/tximport_summary.rds\` or equivalent
- \`results/counts.txt.summary\`
- concise QC note covering assignment rate and strandedness assumptions
`,
}
