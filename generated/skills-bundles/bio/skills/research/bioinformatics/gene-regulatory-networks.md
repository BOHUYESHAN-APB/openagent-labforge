---
name: "gene-regulatory-networks"
description: "Infer and analyze gene regulatory networks from expression and chromatin data. Covers co-expression network analysis, transcription factor regulon discovery, multiomics GRN inference, perturbation simulation, and differential network comparison."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Gene Regulatory Networks Category Guide

Infer and analyze gene regulatory networks from expression and chromatin data. Covers co-expression network analysis, transcription factor regulon discovery, multiomics GRN inference, perturbation simulation, and differential network comparison.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/gene-regulatory-networks/coexpression-networks` — Build weighted gene co-expression networks to identify modules of co-regulated genes and relate them to phenotypes using WGCNA and CEMiTool. Detects hub genes and module-trait relationships from bulk or single-cell expression data. Use when finding co-expression modules, identifying hub genes, or relating gene networks to clinical or experimental variables.
- `research/bioinformatics/gene-regulatory-networks/differential-networks` — Compare gene regulatory and co-expression networks between biological conditions to identify rewired regulatory relationships using DiffCorr. Detects gained, lost, and reversed gene-gene correlations between conditions. Use when comparing co-expression networks between disease vs control, treatment conditions, or developmental stages.
- `research/bioinformatics/gene-regulatory-networks/multiomics-grn` — Build enhancer-driven gene regulatory networks by integrating single-cell RNA-seq and ATAC-seq data using SCENIC+ to identify eRegulons linking transcription factors to enhancers and target genes. Use when analyzing 10x multiome or paired scRNA+scATAC data to infer cis-regulatory GRNs.
- `research/bioinformatics/gene-regulatory-networks/perturbation-simulation` — Simulate transcription factor perturbation effects on cell state using CellOracle, which integrates GRN inference with in silico knockout and overexpression modeling. Predicts cell identity shifts and differentiation trajectory changes from TF perturbations. Use when predicting the effect of transcription factor knockouts, planning perturbation experiments, or identifying driver TFs for cell fate transitions.
- `research/bioinformatics/gene-regulatory-networks/scenic-regulons` — Infer gene regulatory networks and identify transcription factor regulons from single-cell RNA-seq data using pySCENIC. Discovers co-expression modules with GRNBoost2, prunes by cis-regulatory motif enrichment, and scores regulon activity per cell with AUCell. Use when identifying transcription factor regulons, scoring TF activity in single cells, or finding master regulators of cell identity.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.