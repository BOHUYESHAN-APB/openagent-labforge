import type { BuiltinSkill } from "../types"

export const genomeIntervalsSkill: BuiltinSkill = {
  name: "genome-intervals",
  description: "BED, GTF/GFF, bedGraph, bigWig, and interval arithmetic operations for genomic regions, annotations, coverage, and overlaps",
  license: "MIT",
  metadata: {
    category: "research/bioinformatics-genome-intervals",
    domain: "bioinformatics",
    imported_from: "GPTomics/bioSkills",
    source_category: "genome-intervals",
  },
  agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Genome Intervals

Use this skill when a task involves BED/GTF/GFF intervals, overlap logic, promoter windows, coverage tracks, or region filtering.

## Common operations

- sort, merge, intersect, subtract, and flank intervals
- convert between region formats
- annotate peaks against genes or features
- derive promoters, exons, introns, and custom windows
- generate or inspect bedGraph and bigWig coverage tracks

## Preferred tools

- \`bedtools\` for interval arithmetic
- \`pybedtools\` for Python workflows
- \`samtools\` and coverage tools for BAM-derived regions
- \`bigWig\` utilities for track handling

## Starter commands

\`\`\`bash
bedtools intersect -a peaks.bed -b genes.gtf -wa -wb > results/peaks_vs_genes.tsv
\`\`\`

\`\`\`bash
bedtools sort -i peaks.bed | bedtools merge -i - > results/merged_peaks.bed
\`\`\`

\`\`\`bash
bedtools flank -i genes.bed -g genome.sizes -l 2000 -r 500 -s > results/promoters.bed
\`\`\`

## Guardrails

- Confirm coordinate system and chromosome naming before intersecting files.
- Keep strandedness explicit for promoters and transcript-derived regions.
- Sort inputs before operations that require sorted intervals.
- Stop if reference build mismatch is suspected.

## Expected artifacts

- region set outputs such as \`*.bed\` or \`*.tsv\`
- derived promoter or overlap files
- coverage tracks or summary tables when requested
- note documenting reference build and interval conventions
`,
}
