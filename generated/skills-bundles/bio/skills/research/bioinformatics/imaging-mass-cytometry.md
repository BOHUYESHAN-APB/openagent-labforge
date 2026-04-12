---
name: "imaging-mass-cytometry"
description: "Spatial proteomics analysis from imaging mass cytometry (IMC) and multiplexed ion beam imaging (MIBI) data."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Imaging Mass Cytometry Category Guide

Spatial proteomics analysis from imaging mass cytometry (IMC) and multiplexed ion beam imaging (MIBI) data.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/imaging-mass-cytometry/cell-segmentation` — Cell segmentation from multiplexed tissue images. Covers deep learning (Cellpose, Mesmer) and classical approaches for nuclear and whole-cell segmentation. Use when extracting single-cell data from IMC or MIBI images after preprocessing.
- `research/bioinformatics/imaging-mass-cytometry/data-preprocessing` — Load and preprocess imaging mass cytometry (IMC) and MIBI data. Covers MCD/TIFF handling, hot pixel removal, and image normalization. Use when starting IMC analysis from raw MCD files or preparing images for segmentation.
- `research/bioinformatics/imaging-mass-cytometry/interactive-annotation` — Interactive cell type annotation for IMC data. Covers napari-based annotation, marker-guided labeling, training data generation, and annotation validation. Use when manually annotating cell types for training classifiers or validating automated phenotyping results.
- `research/bioinformatics/imaging-mass-cytometry/phenotyping` — Cell type assignment from marker expression in IMC data. Covers manual gating, clustering, and automated classification approaches. Use when assigning cell types to segmented IMC cells based on protein marker expression or when phenotyping cells in multiplexed imaging data.
- `research/bioinformatics/imaging-mass-cytometry/quality-metrics` — Quality metrics for IMC data including signal-to-noise, channel correlation, tissue integrity, and acquisition QC. Use when assessing data quality before analysis or troubleshooting problematic acquisitions.
- `research/bioinformatics/imaging-mass-cytometry/spatial-analysis` — Spatial analysis of cell neighborhoods and interactions in IMC data. Covers neighbor graphs, spatial statistics, and interaction testing. Use when analyzing spatial relationships between cell types, testing for neighborhood enrichment, or identifying cell-cell interaction patterns in imaging mass cytometry data.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.