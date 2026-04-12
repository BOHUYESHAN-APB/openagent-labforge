---
name: "alignment-files"
description: "Working with SAM/BAM/CRAM alignment files using samtools and pysam. Covers the standard NGS workflow: viewing, sorting, indexing, filtering, marking duplicates, and preparing data for variant calling."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Alignment Files Category Guide

Working with SAM/BAM/CRAM alignment files using samtools and pysam. Covers the standard NGS workflow: viewing, sorting, indexing, filtering, marking duplicates, and preparing data for variant calling.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/alignment-files/alignment-filtering` — Filter alignments by flags, mapping quality, and regions using samtools view and pysam. Use when extracting specific reads, removing low-quality alignments, or subsetting to target regions.
- `research/bioinformatics/alignment-files/alignment-indexing` — Create and use BAI/CSI indices for BAM/CRAM files using samtools and pysam. Use when enabling random access to alignment files or fetching specific genomic regions.
- `research/bioinformatics/alignment-files/alignment-sorting` — Sort alignment files by coordinate or read name using samtools and pysam. Use when preparing BAM files for indexing, variant calling, or paired-end analysis.
- `research/bioinformatics/alignment-files/alignment-validation` — Validate alignment quality with insert size distribution, proper pairing rates, GC bias, strand balance, and other post-alignment metrics. Use when verifying alignment data quality before variant calling or quantification.
- `research/bioinformatics/alignment-files/bam-statistics` — Generate alignment statistics using samtools flagstat, stats, depth, and coverage. Use when assessing alignment quality, calculating coverage, or generating QC reports.
- `research/bioinformatics/alignment-files/duplicate-handling` — Mark and remove PCR/optical duplicates using samtools fixmate and markdup. Use when preparing alignments for variant calling or when duplicate reads would bias analysis.
- `research/bioinformatics/alignment-files/pileup-generation` — Generate pileup data for variant calling using samtools mpileup and pysam. Use when preparing data for variant calling, analyzing per-position read data, or calculating allele frequencies.
- `research/bioinformatics/alignment-files/reference-operations` — Generate consensus sequences and manage reference files using samtools. Use when creating consensus from alignments, indexing references, or creating sequence dictionaries.
- `research/bioinformatics/alignment-files/sam-bam-basics` — View, convert, and understand SAM/BAM/CRAM alignment files using samtools and pysam. Use when inspecting alignments, converting between formats, or understanding alignment file structure.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.