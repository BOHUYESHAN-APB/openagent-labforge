---
name: "crispr-screens"
description: "Analysis of pooled CRISPR knockout and activation screens for gene essentiality and functional genomics."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Crispr Screens Category Guide

Analysis of pooled CRISPR knockout and activation screens for gene essentiality and functional genomics.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/crispr-screens/base-editing-analysis` — Analyzes base editing and prime editing outcomes including editing efficiency, bystander edits, and indel frequencies. Use when quantifying CRISPR base editor results, comparing ABE vs CBE efficiency, or assessing prime editing fidelity.
- `research/bioinformatics/crispr-screens/batch-correction` — Batch effect correction for CRISPR screens. Covers normalization across batches, technical replicate handling, and batch-aware analysis. Use when combining screens from multiple batches or correcting systematic technical variation.
- `research/bioinformatics/crispr-screens/crispresso-editing` — CRISPResso2 for analyzing CRISPR gene editing outcomes. Quantifies indels, HDR efficiency, and generates comprehensive editing reports. Use when analyzing amplicon sequencing data from CRISPR editing experiments to assess editing efficiency.
- `research/bioinformatics/crispr-screens/hit-calling` — Statistical methods for calling hits in CRISPR screens. Covers MAGeCK, BAGEL2, drugZ, and custom approaches for identifying essential and resistance genes. Use when identifying significant genes from screen count data after QC passes.
- `research/bioinformatics/crispr-screens/jacks-analysis` — JACKS (Joint Analysis of CRISPR/Cas9 Knockout Screens) for modeling sgRNA efficacy and gene essentiality. Use when analyzing multiple CRISPR screens simultaneously or when accounting for variable sgRNA efficiency across experiments.
- `research/bioinformatics/crispr-screens/library-design` — CRISPR library design for genetic screens. Covers sgRNA selection, library composition, control design, and oligo ordering. Use when designing custom sgRNA libraries for knockout, activation, or interference screens.
- `research/bioinformatics/crispr-screens/mageck-analysis` — MAGeCK (Model-based Analysis of Genome-wide CRISPR-Cas9 Knockout) for pooled CRISPR screen analysis. Covers count normalization, gene ranking, and pathway analysis. Use when identifying essential genes, drug targets, or resistance mechanisms from dropout or enrichment screens.
- `research/bioinformatics/crispr-screens/screen-qc` — Quality control for pooled CRISPR screens. Covers library representation, read distribution, replicate correlation, and essential gene recovery. Use when assessing screen quality before hit calling or diagnosing poor screen performance.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.