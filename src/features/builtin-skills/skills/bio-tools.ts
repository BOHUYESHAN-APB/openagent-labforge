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

Use this skill when you need a grounded tool map before executing a bioinformatics task.

## Runtime strategy

- Python-first analysis environments: prefer \`uv\`
- mixed native stacks or R-heavy workflows: prefer \`conda\`
- Windows users often need WSL for Linux-only bio packages; say this early instead of discovering it halfway through setup

## Core tool families

- sequence parsing and quick checks: BioPython, seqtk
- sequence similarity and domains: BLAST+, HMMER
- alignment and BAM handling: bwa, minimap2, samtools
- interval arithmetic: bedtools
- QC: fastqc
- bulk expression: pandas, PyDESeq2, DESeq2
- single-cell: scanpy, anndata
- structure and chemistry: Bio.PDB, RDKit, PyMOL-style rendering
- genome browser or publication plotting: pyGenomeTracks, matplotlib, seaborn, ComplexHeatmap, cnsplots when available

## Directory contract

- \`raw/\`: untouched inputs
- \`intermediate/\`: checkpoint-safe derived files
- \`results/\`: final tables and machine-readable outputs
- \`qc/\`: quality metrics and reports
- \`figures/\`: publication or slide-ready plots
- \`logs/\`: command outputs and stderr/stdout captures
- \`env/\`: versions, lockfiles, and environment notes

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
seqtk size reads.fq
\`\`\`

### Genome arithmetic
\`\`\`bash
bedtools intersect -a regions.bed -b features.bed
bedtools coverage -a regions.bed -b aligned.bam
bedtools getfasta -fi reference.fa -bed regions.bed
\`\`\`

### BLAST and sequence search
\`\`\`bash
blastn -query input.fa -subject ref.fa -outfmt 6 -evalue 1e-5
blastp -query protein.fa -subject ref_protein.fa -outfmt 6
\`\`\`

### Python quick recipes
\`\`\`python
from Bio import SeqIO
from Bio.SeqUtils import gc_fraction
import scanpy as sc
import pandas as pd
\`\`\`

## Execution rules

- confirm exact tool availability before claiming a command is runnable
- prefer scripts or notebooks once a workflow exceeds a few commands
- record versions when results depend on package behavior
- if you are switching between Python, R, and native tools, write down the boundary and the expected artifacts at each handoff
- if a commercial or semi-commercial tool is mentioned, separate what can be done in open tools versus what the user must do manually

## Figure and reporting guidance

- save publication-oriented plots as \`.pdf\` or \`.svg\` when possible
- if plots are generated from script templates, record the input table, transformation, and output path
- for genome tracks, prefer config-driven tools such as \`pyGenomeTracks\`
- for journal-style plots, use a higher-quality styling layer rather than raw library defaults when the stack already supports it

## Artifact expectations

- \`env/versions.txt\` or equivalent version record
- \`logs/\` for command logs
- \`results/\` for final tables
- \`qc/\` for quality-control outputs
- \`figures/\` for plots and panels

## Output contract

- tools selected
- why each tool is appropriate
- exact commands or code snippets
- expected artifacts
- environment and version assumptions
- which steps require WSL, conda, or extra native installs`,
}
