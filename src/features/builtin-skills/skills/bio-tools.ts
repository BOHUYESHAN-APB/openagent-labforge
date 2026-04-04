import type { BuiltinSkill } from "../types"

export const bioToolsSkill: BuiltinSkill = {
  name: "bio-tools",
  description: "Reference for core bioinformatics CLI/Python tooling, common commands, and expected output artifacts",
  metadata: {
    category: "research/bioinformatics-toolbox",
    domain: "bioinformatics",
  },
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(Rscript:*)", "Bash(*)"],
  template: `# Bioinformatics Tools Reference

Use this skill when you need a compact tool map before running a bioinformatics task.

## Core tool families

- Sequence and FASTA/FASTQ: BioPython, seqtk
- Alignment and BAM handling: bwa, minimap2, samtools
- Interval and genome arithmetic: bedtools
- QC: fastqc
- Bulk expression analysis: pandas, PyDESeq2, DESeq2
- Single-cell analysis: scanpy, anndata
- Structure and chemistry: Bio.PDB, RDKit, PyMOL-compatible workflows

## Typical command patterns

### Alignment and BAM processing
\`\`\`bash
bwa index reference.fa
bwa mem reference.fa reads_R1.fq reads_R2.fq > aligned.sam
samtools view -bS aligned.sam | samtools sort -o sorted.bam
samtools index sorted.bam
\`\`\`

### QC
\`\`\`bash
fastqc reads.fq -o qc_output/
seqtk comp reads.fq | head
\`\`\`

### Genome arithmetic
\`\`\`bash
bedtools intersect -a regions.bed -b features.bed
bedtools coverage -a regions.bed -b aligned.bam
\`\`\`

### Python quick recipes
\`\`\`python
from Bio import SeqIO
from Bio.SeqUtils import gc_fraction
import scanpy as sc
import pandas as pd
\`\`\`

## Execution rules

- Confirm exact tool availability before claiming a command is runnable.
- Prefer scripts or notebooks once a workflow exceeds a few commands.
- Keep outputs under explicit directories for raw, intermediate, final, and figures.
- Record versions when results depend on package behavior.

## Output contract

- tools selected
- why each tool is appropriate
- exact commands or code snippets
- expected artifacts
`,
}
