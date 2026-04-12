---
name: "liquid-biopsy"
description: "Cell-free DNA and circulating tumor DNA analysis for non-invasive cancer detection, tumor fraction estimation, mutation detection, and treatment monitoring from plasma samples."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Liquid Biopsy Category Guide

Cell-free DNA and circulating tumor DNA analysis for non-invasive cancer detection, tumor fraction estimation, mutation detection, and treatment monitoring from plasma samples.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/liquid-biopsy/cfdna-preprocessing` — Preprocesses cell-free DNA sequencing data including adapter trimming, alignment optimized for short fragments, and UMI-aware duplicate removal using fgbio. Applies cfDNA-specific quality thresholds and fragment length filtering. Use when processing plasma cfDNA sequencing data before downstream analysis.
- `research/bioinformatics/liquid-biopsy/ctdna-mutation-detection` — Detects somatic mutations in circulating tumor DNA using variant callers optimized for low allele fractions with UMI-based error suppression. Reliably detects mutations at VAF above 0.5 percent using consensus-based approaches. Use when identifying tumor mutations from plasma DNA or tracking specific variants.
- `research/bioinformatics/liquid-biopsy/fragment-analysis` — Analyzes cfDNA fragment size distributions and fragmentomics features using FinaleToolkit or Griffin. Extracts nucleosome positioning patterns, fragment ratios, and DELFI-style fragmentation profiles for cancer detection. Use when leveraging fragment patterns for tumor detection or tissue-of-origin analysis.
- `research/bioinformatics/liquid-biopsy/longitudinal-monitoring` — Tracks ctDNA dynamics over time for treatment response monitoring using serial liquid biopsy samples. Analyzes tumor fraction trends, mutation clearance kinetics, and defines molecular response criteria. Use when monitoring patients during therapy or detecting molecular relapse before clinical progression.
- `research/bioinformatics/liquid-biopsy/methylation-based-detection` — Analyzes cfDNA methylation patterns for cancer detection using cfMeDIP-seq or bisulfite sequencing with MethylDackel. Identifies cancer-specific methylation signatures and performs tissue-of-origin deconvolution. Use when using methylation biomarkers for early cancer detection or minimal residual disease.
- `research/bioinformatics/liquid-biopsy/tumor-fraction-estimation` — Estimates circulating tumor DNA fraction from shallow whole-genome sequencing using ichorCNA. Detects copy number alterations via HMM segmentation and calculates ctDNA percentage. Requires 0.1-1x sWGS coverage. Use when quantifying tumor burden from liquid biopsy or monitoring treatment response.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.