---
name: "read-alignment"
description: "Align short reads to reference genomes using standard aligners. Covers DNA alignment with bwa-mem2/bowtie2 and RNA-seq spliced alignment with STAR/HISAT2."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Read Alignment Category Guide

Align short reads to reference genomes using standard aligners. Covers DNA alignment with bwa-mem2/bowtie2 and RNA-seq spliced alignment with STAR/HISAT2.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/read-alignment/bowtie2-alignment` — Align short reads using Bowtie2 with local or end-to-end modes. Supports gapped alignment. Use when aligning ChIP-seq, ATAC-seq, or when flexible alignment modes are needed.
- `research/bioinformatics/read-alignment/bwa-alignment` — Align DNA short reads to reference genomes using bwa-mem2, the faster successor to BWA-MEM. Use when aligning DNA short reads to a reference genome.
- `research/bioinformatics/read-alignment/hisat2-alignment` — Align RNA-seq reads with HISAT2, a memory-efficient splice-aware aligner. Use when STAR's memory requirements are too high or for general RNA-seq alignment.
- `research/bioinformatics/read-alignment/star-alignment` — Align RNA-seq reads with STAR (Spliced Transcripts Alignment to a Reference). Supports two-pass mode for novel splice junction discovery. Use when aligning RNA-seq data requiring splice-aware alignment.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.