import type { BuiltinSkill } from "../types"

export const atacSeqSkill: BuiltinSkill = {
  name: "atac-seq",
  description: "Bulk ATAC-seq QC, peak calling, consensus peak matrices, and differential accessibility follow-up",
  metadata: {
    category: "research/atac-seq",
    domain: "bioinformatics",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# ATAC-seq

Use this skill for bulk ATAC-seq processing, assay QC, peak calling, accessibility matrices, and downstream differential accessibility.

## Runtime expectations

- \`macs3\`
- \`samtools\`
- \`deepTools\`

Verify first:

\`\`\`bash
macs3 --version
samtools --version
bamCoverage --version
\`\`\`

## Quick route

- paired-end bulk ATAC → use fragment-aware \`BAMPE\`
- poor TSS enrichment → stop and flag quality before interpretation
- motif or footprint follow-up only after library quality is credible

## Core workflow

1. QC:
- mapped read depth
- duplication burden
- fragment periodicity
- TSS enrichment
- FRiP

2. Peak calling:

\`\`\`bash
macs3 callpeak -t atac.bam -f BAMPE -g hs -n sample --nomodel --shift -100 --extsize 200 -q 0.01 --outdir results/peaks
\`\`\`

3. Consensus peak matrix:
- merge peaks across samples
- count fragments into consensus intervals
- export peak-by-sample matrix

4. Differential accessibility:
- use replicate-aware statistics
- report effect size and adjusted significance

5. Follow-up:
- motif enrichment
- footprinting
- gene/regulatory interpretation

## Quality rules

- TSS enrichment below ~7 should trigger caution
- FRiP below ~0.1 is usually weak
- do not run footprinting on weak libraries just because the user asked
- do not use generic ChIP defaults for ATAC without Tn5-aware reasoning

## Expected artifacts

- \`results/peaks/sample_peaks.narrowPeak\`
- \`results/matrix/consensus_peak_counts.tsv\`
- \`results/diff_accessibility.tsv\`
- \`qc/tss_enrichment.tsv\`
- \`figures/tss_enrichment.pdf\`
- \`figures/fragment_size_distribution.pdf\``,
}
