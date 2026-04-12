---
name: "ribo-seq"
description: "Analyze ribosome profiling (Ribo-seq) data to study translation at single-codon resolution, including periodicity QC, ORF detection, and translation efficiency calculation."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Ribo Seq Category Guide

Analyze ribosome profiling (Ribo-seq) data to study translation at single-codon resolution, including periodicity QC, ORF detection, and translation efficiency calculation.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/ribo-seq/orf-detection` — Detect and quantify translated ORFs from Ribo-seq data including uORFs and novel ORFs using RiboCode and ORFquant. Use when identifying translated regions beyond annotated coding sequences or quantifying ORF-level translation.
- `research/bioinformatics/ribo-seq/riboseq-preprocessing` — Preprocess ribosome profiling data including adapter trimming, size selection, rRNA removal, and alignment. Use when preparing Ribo-seq reads for downstream analysis of translation.
- `research/bioinformatics/ribo-seq/ribosome-periodicity` — Validate Ribo-seq data quality by checking 3-nucleotide periodicity and calculating P-site offsets. Use when assessing library quality or determining read offsets for downstream analysis.
- `research/bioinformatics/ribo-seq/ribosome-stalling` — Detect ribosome pausing and stalling sites from Ribo-seq data at codon resolution. Use when studying translational regulation, identifying pause sites, or analyzing codon-specific translation dynamics.
- `research/bioinformatics/ribo-seq/translation-efficiency` — Calculate translation efficiency (TE) as the ratio of ribosome occupancy to mRNA abundance. Use when comparing translational regulation between conditions or identifying genes with altered translation independent of transcription.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.