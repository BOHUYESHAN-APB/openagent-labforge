---
name: "multi-omics-integration"
description: "Statistical integration of multiple omics data types (transcriptomics, proteomics, metabolomics, etc.) for biological discovery."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Multi Omics Integration Category Guide

Statistical integration of multiple omics data types (transcriptomics, proteomics, metabolomics, etc.) for biological discovery.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/multi-omics-integration/data-harmonization` — Preprocessing and harmonization of multi-omics data before integration. Covers normalization, batch correction, feature alignment, and missing value handling across data types. Use when preparing multi-omics datasets for integration analysis.
- `research/bioinformatics/multi-omics-integration/mixomics-analysis` — Supervised and unsupervised multi-omics integration with mixOmics. Includes sPLS for pairwise integration and DIABLO for multi-block discriminant analysis. Use when performing supervised multi-omics integration or identifying features that discriminate between groups.
- `research/bioinformatics/multi-omics-integration/mofa-integration` — Multi-Omics Factor Analysis (MOFA2) for unsupervised integration of multiple data modalities. Identifies shared and view-specific sources of variation. Use when integrating RNA-seq, proteomics, methylation, or other omics to discover latent factors driving biological variation across modalities.
- `research/bioinformatics/multi-omics-integration/similarity-network` — Similarity Network Fusion (SNF) for patient stratification using multi-omics data. Integrates multiple data types into a unified patient similarity network. Use when performing patient stratification or integrating multi-omics data into unified similarity networks.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.