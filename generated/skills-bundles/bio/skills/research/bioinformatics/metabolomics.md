---
name: "metabolomics"
description: "LC-MS and GC-MS metabolomics analysis from raw data to metabolite identification and pathway interpretation."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Metabolomics Category Guide

LC-MS and GC-MS metabolomics analysis from raw data to metabolite identification and pathway interpretation.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/metabolomics/lipidomics` — Specialized lipidomics analysis for lipid identification, quantification, and pathway interpretation. Covers LC-MS lipidomics with LipidSearch, MS-DIAL, and LipidMaps annotation. Use when analyzing lipid classes, chain composition, or lipid-specific pathways.
- `research/bioinformatics/metabolomics/metabolite-annotation` — Metabolite identification from m/z and retention time. Covers database matching, MS/MS spectral matching, and confidence level assignment. Use when assigning compound identities to detected features in untargeted metabolomics.
- `research/bioinformatics/metabolomics/msdial-preprocessing` — MS-DIAL-based metabolomics preprocessing as alternative to XCMS. Covers peak detection, alignment, annotation, and export for downstream analysis. Use when processing MS-DIAL output files for R/Python analysis or when preferring GUI-based preprocessing.
- `research/bioinformatics/metabolomics/normalization-qc` — Quality control and normalization for metabolomics data. Covers QC-based correction, batch effect removal, and data transformation methods. Use when correcting technical variation in metabolomics data before statistical analysis.
- `research/bioinformatics/metabolomics/pathway-mapping` — Map metabolites to biological pathways using KEGG, Reactome, and MetaboAnalyst. Perform pathway enrichment and topology analysis. Use when interpreting metabolomics results in the context of biochemical pathways.
- `research/bioinformatics/metabolomics/statistical-analysis` — Statistical analysis for metabolomics data. Covers preprocessing (log2 transformation, normalization), limma moderated testing with empirical Bayes, Welch's t-tests with BH correction, fold change estimation, and multivariate methods (PCA, PLS-DA, OPLS-DA). Use when identifying differentially abundant metabolites or building classification models.
- `research/bioinformatics/metabolomics/targeted-analysis` — Targeted metabolomics analysis using MRM/SRM with standard curves. Covers absolute quantification, method validation, and quality assessment. Use when quantifying specific metabolites using calibration curves and internal standards.
- `research/bioinformatics/metabolomics/xcms-preprocessing` — XCMS3 workflow for LC-MS/MS metabolomics preprocessing. Covers peak detection, retention time alignment, correspondence (grouping), and gap filling. Use when processing raw LC-MS data into a feature table for untargeted metabolomics.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.