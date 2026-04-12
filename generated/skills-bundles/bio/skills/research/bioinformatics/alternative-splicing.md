---
name: "alternative-splicing"
description: "Alternative splicing analysis for RNA-seq data covering event quantification, differential splicing detection, isoform switching analysis, and visualization."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Alternative Splicing Category Guide

Alternative splicing analysis for RNA-seq data covering event quantification, differential splicing detection, isoform switching analysis, and visualization.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/alternative-splicing/differential-splicing` — Detects differential alternative splicing between conditions using rMATS-turbo (BAM-based) or SUPPA2 diffSplice (TPM-based). Reports events with FDR-corrected significance and delta PSI effect sizes. Use when comparing splicing patterns between treatment groups, tissues, or disease states.
- `research/bioinformatics/alternative-splicing/isoform-switching` — Analyzes isoform switching events and functional consequences using IsoformSwitchAnalyzeR. Predicts protein domain changes, NMD sensitivity, ORF alterations, and coding potential shifts between conditions. Use when investigating how splicing changes affect protein function.
- `research/bioinformatics/alternative-splicing/sashimi-plots` — Creates sashimi plots showing RNA-seq read coverage and splice junction counts using ggsashimi or rmats2sashimiplot. Visualizes differential splicing events with grouped samples and junction read support. Use when visualizing specific splicing events or validating differential splicing results.
- `research/bioinformatics/alternative-splicing/single-cell-splicing` — Analyzes alternative splicing at single-cell resolution using BRIE2 for probabilistic PSI estimation or leafcutter2 for cluster-based analysis with NMD detection. Identifies cell-type-specific splicing patterns. Use when analyzing isoform usage in scRNA-seq or finding splicing differences between cell populations.
- `research/bioinformatics/alternative-splicing/splicing-qc` — Assesses RNA-seq data quality for splicing analysis including junction saturation curves, splice site strength scoring, and junction coverage metrics using RSeQC. Use when evaluating data suitability for splicing analysis or troubleshooting low event detection.
- `research/bioinformatics/alternative-splicing/splicing-quantification` — Quantifies alternative splicing events (PSI/percent spliced in) from RNA-seq using SUPPA2 from transcript TPM or rMATS-turbo from BAM files. Calculates inclusion levels for skipped exons, alternative splice sites, mutually exclusive exons, and retained introns. Use when measuring splice site usage or isoform ratios from RNA-seq data.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.