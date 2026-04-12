---
name: "flow-cytometry"
description: "Flow and mass cytometry analysis from FCS files to differential cell populations."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Flow Cytometry Category Guide

Flow and mass cytometry analysis from FCS files to differential cell populations.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/flow-cytometry/bead-normalization` — Bead-based normalization for CyTOF and high-parameter flow cytometry. Covers EQ bead normalization, signal drift correction, and batch normalization. Use when correcting instrument drift in CyTOF or harmonizing data across batches.
- `research/bioinformatics/flow-cytometry/clustering-phenotyping` — Unsupervised clustering and cell type identification for flow/mass cytometry. Covers FlowSOM, Phenograph, and CATALYST workflows. Use when discovering cell populations in high-dimensional cytometry data without predefined gates.
- `research/bioinformatics/flow-cytometry/compensation-transformation` — Spillover compensation and data transformation for flow cytometry. Covers compensation matrix calculation, application, and biexponential/arcsinh transforms. Use when correcting spectral overlap between fluorophores or transforming data for analysis.
- `research/bioinformatics/flow-cytometry/cytometry-qc` — Comprehensive quality control for flow cytometry and CyTOF data. Covers flow rate stability, signal drift, margin events, dead cell exclusion, and batch QC. Use when assessing acquisition quality or identifying problematic samples before analysis.
- `research/bioinformatics/flow-cytometry/differential-analysis` — Differential abundance and state analysis for cytometry data. Compare cell populations between conditions using statistical methods. Use when testing for significant changes in cell frequencies or marker expression between groups.
- `research/bioinformatics/flow-cytometry/doublet-detection` — Detect and remove doublets from flow and mass cytometry data. Covers FSC/SSC gating and computational doublet detection methods. Use when filtering out cell aggregates before clustering or quantitative analysis.
- `research/bioinformatics/flow-cytometry/fcs-handling` — Read and manipulate Flow Cytometry Standard (FCS) files. Covers loading data, accessing parameters, and basic data exploration. Use when loading and inspecting flow or mass cytometry data before preprocessing.
- `research/bioinformatics/flow-cytometry/gating-analysis` — Manual and automated gating for defining cell populations in flow cytometry. Covers rectangular, polygon, and data-driven gates. Use when identifying cell populations through hierarchical gating strategies.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.