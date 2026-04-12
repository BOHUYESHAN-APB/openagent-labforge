---
name: "expression-matrix"
description: "Load, normalize, manipulate, and annotate gene expression count matrices. Covers reading various formats (CSV, TSV, H5AD, RDS, 10X), normalization and transformation for different downstream tasks, sparse matrix handling for large datasets, gene ID mapping between databases, and joining sample metadata with experimental design guidance."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Expression Matrix Category Guide

Load, normalize, manipulate, and annotate gene expression count matrices. Covers reading various formats (CSV, TSV, H5AD, RDS, 10X), normalization and transformation for different downstream tasks, sparse matrix handling for large datasets, gene ID mapping between databases, and joining sample metadata with experimental design guidance.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/expression-matrix/counts-ingest` — Load gene expression count matrices from various formats including CSV, TSV, featureCounts, Salmon, kallisto, and 10X. Use when importing quantification results for downstream analysis.
- `research/bioinformatics/expression-matrix/gene-id-mapping` — Convert between gene identifier systems including Ensembl, Entrez, HGNC symbols, and UniProt. Use when mapping IDs for pathway analysis or matching different data sources.
- `research/bioinformatics/expression-matrix/metadata-joins` — Merge sample metadata with count matrices and add gene annotations. Use when preparing data for differential expression analysis or visualization.
- `research/bioinformatics/expression-matrix/normalization` — Normalize and transform RNA-seq count matrices for differential expression, visualization, and clustering. Covers between-sample (TMM, RLE, upper quartile), within-sample (TPM, FPKM), variance-stabilizing (VST, rlog), and single-cell (scran) methods. Use when choosing or applying normalization to expression data.
- `research/bioinformatics/expression-matrix/sparse-handling` — Work with sparse matrices for memory-efficient storage of count data. Use when dealing with single-cell data or large bulk RNA-seq datasets where most values are zero.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.