---
name: "epitranscriptomics"
description: "Analysis of RNA modifications (m6A, m5C) from MeRIP-seq and direct RNA sequencing."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Epitranscriptomics Category Guide

Analysis of RNA modifications (m6A, m5C) from MeRIP-seq and direct RNA sequencing.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/epitranscriptomics/m6a-differential` — Identify differential m6A methylation between conditions from MeRIP-seq. Use when comparing epitranscriptomic changes between treatment groups or cell states.
- `research/bioinformatics/epitranscriptomics/m6a-peak-calling` — Call m6A peaks from MeRIP-seq IP vs input comparisons. Use when identifying m6A modification sites from methylated RNA immunoprecipitation data.
- `research/bioinformatics/epitranscriptomics/m6anet-analysis` — Detect m6A modifications from Oxford Nanopore direct RNA sequencing using m6Anet. Use when analyzing epitranscriptomic modifications from long-read RNA data without immunoprecipitation.
- `research/bioinformatics/epitranscriptomics/merip-preprocessing` — Align and QC MeRIP-seq IP and input samples for m6A analysis. Use when preparing MeRIP-seq data for peak calling or differential methylation analysis.
- `research/bioinformatics/epitranscriptomics/modification-visualization` — Create metagene plots and browser tracks for RNA modification data. Use when visualizing m6A distribution patterns around genomic features like stop codons.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.