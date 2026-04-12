---
name: "copy-number"
description: "Detect and analyze copy number variants (CNVs) from whole genome, exome, or targeted sequencing data. Covers read-depth based CNV detection with CNVkit and GATK, visualization, and functional annotation."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Copy Number Category Guide

Detect and analyze copy number variants (CNVs) from whole genome, exome, or targeted sequencing data. Covers read-depth based CNV detection with CNVkit and GATK, visualization, and functional annotation.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/copy-number/cnv-annotation` — Annotate CNVs with genes, pathways, and clinical significance. Use when interpreting CNV calls or identifying affected genes from copy number analysis.
- `research/bioinformatics/copy-number/cnv-visualization` — Visualize copy number profiles, segments, and compare across samples. Create publication-quality plots of CNV data from CNVkit, GATK, or other callers. Use when creating genome-wide CNV plots, sample heatmaps, or chromosome-level visualizations.
- `research/bioinformatics/copy-number/cnvkit-analysis` — Detect copy number variants from targeted/exome sequencing using CNVkit. Supports tumor-normal pairs, tumor-only, and germline CNV calling. Use when detecting CNVs from WES or targeted panel sequencing data.
- `research/bioinformatics/copy-number/gatk-cnv` — Call copy number variants using GATK best practices workflow. Supports both somatic (tumor-normal) and germline CNV detection from WGS or WES data. Use when following GATK best practices or integrating CNV calling with other GATK variant pipelines.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.