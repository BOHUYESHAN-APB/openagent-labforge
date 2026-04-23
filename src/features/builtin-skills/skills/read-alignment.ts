import type { BuiltinSkill } from "../types"

export const readAlignmentSkill: BuiltinSkill = {
  name: "read-alignment",
  description: "Short-read, splice-aware, and long-read alignment planning and execution for DNA-seq, RNA-seq, ATAC/ChIP, and related assays",
  license: "MIT",
  metadata: {
    category: "research/bioinformatics-read-alignment",
    domain: "bioinformatics",
    imported_from: "GPTomics/bioSkills",
    source_category: "read-alignment",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Read Alignment

Use this skill when the task is mapping FASTQ reads to a reference genome or transcriptome.

## Choose the aligner by assay

- RNA-seq: \`STAR\` or \`HISAT2\`
- DNA/WGS/WES short reads: \`bwa-mem2\`
- ChIP-seq or ATAC-seq short reads: \`bowtie2\` or \`bwa-mem2\`
- Long reads: \`minimap2\`

Never pick an aligner before checking assay type, read layout, strandedness needs, and reference assets.

## Mandatory workflow

1. Verify inputs:
- FASTQ pairs and naming
- reference genome build
- annotation file if splice-aware alignment is needed
2. Confirm or build indexes.
3. Run alignment with explicit threads and output prefix.
4. Sort and index BAM output.
5. Review alignment summary before downstream steps.

## Starter patterns

\`\`\`bash
STAR --runMode genomeGenerate \
  --runThreadN 8 \
  --genomeDir star_index/ \
  --genomeFastaFiles reference.fa \
  --sjdbGTFfile annotation.gtf \
  --sjdbOverhang 149
\`\`\`

\`\`\`bash
STAR \
  --runThreadN 8 \
  --genomeDir star_index/ \
  --readFilesIn reads_1.fq.gz reads_2.fq.gz \
  --readFilesCommand zcat \
  --outFileNamePrefix align/sample_ \
  --outSAMtype BAM SortedByCoordinate \
  --twopassMode Basic
\`\`\`

\`\`\`bash
bwa-mem2 mem -t 16 reference.fa reads_1.fq.gz reads_2.fq.gz | samtools sort -o align/sample.bam
samtools index align/sample.bam
\`\`\`

## Review gates

- Confirm mapping rate, multi-mapping behavior, insert-size sanity, and duplicate burden.
- RNA-seq needs splice-aware summaries and strandedness awareness.
- Stop if reference build and annotation build do not match.
- Do not continue with an unsorted or unindexed BAM unless the downstream tool explicitly supports it.

## Expected artifacts

- \`align/*.bam\`
- \`align/*.bai\`
- aligner logs and summary metrics
- junction or transcript-count side outputs when applicable
`,
}
