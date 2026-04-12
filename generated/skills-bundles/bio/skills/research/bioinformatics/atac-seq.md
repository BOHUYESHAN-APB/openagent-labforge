---
name: "atac-seq"
description: "Analyze ATAC-seq data for chromatin accessibility profiling. Covers peak calling with MACS3, quality control metrics, differential accessibility analysis, and transcription factor footprinting."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Atac Seq Category Guide

Analyze ATAC-seq data for chromatin accessibility profiling. Covers peak calling with MACS3, quality control metrics, differential accessibility analysis, and transcription factor footprinting.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/atac-seq/atac-peak-calling` — Call accessible chromatin regions from ATAC-seq data using MACS3 with ATAC-specific parameters. Use when identifying open chromatin regions from aligned ATAC-seq BAM files, different from ChIP-seq peak calling.
- `research/bioinformatics/atac-seq/atac-qc` — Quality control metrics for ATAC-seq data including fragment size distribution, TSS enrichment, FRiP, and library complexity. Use when assessing ATAC-seq library quality before or after peak calling to identify problematic samples.
- `research/bioinformatics/atac-seq/differential-accessibility` — Find differentially accessible chromatin regions between conditions using DiffBind or DESeq2. Use when comparing chromatin accessibility between treatment groups, cell types, or developmental stages in ATAC-seq experiments.
- `research/bioinformatics/atac-seq/footprinting` — Detect transcription factor binding sites through footprinting analysis in ATAC-seq data using TOBIAS. Use when identifying TF occupancy patterns within accessible regions, as TF binding protects DNA from Tn5 cutting.
- `research/bioinformatics/atac-seq/motif-deviation` — Analyze transcription factor motif accessibility variability using chromVAR. Use when identifying which TF motifs show variable accessibility across samples or conditions in ATAC-seq data.
- `research/bioinformatics/atac-seq/nucleosome-positioning` — Extract nucleosome positions from ATAC-seq data using NucleoATAC, ATACseqQC, and fragment analysis. Use when analyzing chromatin organization, identifying nucleosome-free regions at promoters, or characterizing nucleosome occupancy patterns from ATAC-seq fragment size distributions.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.