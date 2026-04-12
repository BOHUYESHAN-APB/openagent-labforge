---
name: "differential-expression"
description: "Differential expression analysis using R/Bioconductor packages DESeq2 and edgeR for RNA-seq count data. Covers the complete workflow from count matrix to visualizations and significant gene lists, including decision guidance for method selection, result interpretation, and prokaryotic organisms."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Differential Expression Category Guide

Differential expression analysis using R/Bioconductor packages DESeq2 and edgeR for RNA-seq count data. Covers the complete workflow from count matrix to visualizations and significant gene lists, including decision guidance for method selection, result interpretation, and prokaryotic organisms.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/differential-expression/batch-correction` — Remove batch effects from RNA-seq data using ComBat, ComBat-Seq, limma removeBatchEffect, and SVA for unknown batch variables. Use when correcting batch effects in expression data.
- `research/bioinformatics/differential-expression/de-results` — Extract, filter, annotate, and export differential expression results from DESeq2 or edgeR. Use for identifying significant genes, applying multiple testing corrections, adding gene annotations, and preparing results for downstream analysis. Use when filtering and exporting DE analysis results.
- `research/bioinformatics/differential-expression/de-visualization` — Visualize differential expression results using DESeq2/edgeR built-in functions. Covers plotMA, plotDispEsts, plotCounts, plotBCV, sample distance heatmaps, and p-value histograms. Use when visualizing differential expression results.
- `research/bioinformatics/differential-expression/deseq2-basics` — Perform differential expression analysis using DESeq2 in R/Bioconductor. Use for analyzing RNA-seq count data, creating DESeqDataSet objects, running the DESeq workflow, and extracting results with log fold change shrinkage. Use when performing DE analysis with DESeq2.
- `research/bioinformatics/differential-expression/edger-basics` — Perform differential expression analysis using edgeR in R/Bioconductor. Use for analyzing RNA-seq count data with the quasi-likelihood F-test framework, creating DGEList objects, normalization, dispersion estimation, and statistical testing. Use when performing DE analysis with edgeR.
- `research/bioinformatics/differential-expression/timeseries-de` — Analyze time-series RNA-seq data using limma voom with splines, maSigPro, and ImpulseDE2. Identify genes with dynamic expression patterns. Use when analyzing time-series or longitudinal expression data.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.