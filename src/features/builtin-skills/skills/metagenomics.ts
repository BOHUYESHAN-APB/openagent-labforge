import type { BuiltinSkill } from "../types"

export const metagenomicsSkill: BuiltinSkill = {
  name: "metagenomics",
  description: "Shotgun metagenomics QC, host depletion review, taxonomic profiling, functional profiling, and AMR-aware outputs",
  metadata: {
    category: "research/metagenomics",
    domain: "bioinformatics",
  },
  agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Metagenomics

Use this skill for shotgun metagenomics when the user needs taxonomy, pathway/function, host depletion review, or AMR-oriented follow-up.

## Typical tool stack

- \`fastp\`
- \`kraken2\`
- \`bracken\`
- \`metaphlan\`
- \`humann\`

## Workflow

1. Read QC and host depletion:
- adapters and quality
- retained reads
- host contamination review for host-associated samples

2. Taxonomic profiling:

\`\`\`bash
kraken2 --db $KRAKEN_DB --paired sample_R1.fastq.gz sample_R2.fastq.gz --report results/taxonomy/sample.kraken.report --output results/taxonomy/sample.kraken.out --confidence 0.1
\`\`\`

3. Abundance refinement:
- species / genus tables
- cohort-ready merged matrices

4. Functional or AMR follow-up:
- HUMAnN or equivalent
- resistance profiling if biologically justified

## Quality rules

- host contamination must be stated explicitly for host-associated samples
- database choice and version materially affect results; record them
- do not make strain-level claims from shallow genus-level evidence
- distinguish relative abundance, counts, and normalized pathway estimates

## Expected artifacts

- \`results/taxonomy/bracken_species.tsv\`
- \`results/taxonomy/bracken_genus.tsv\`
- \`results/function/pathabundance.tsv\`
- \`results/amr/amr_summary.tsv\`
- \`qc/read_processing_summary.tsv\``,
}
