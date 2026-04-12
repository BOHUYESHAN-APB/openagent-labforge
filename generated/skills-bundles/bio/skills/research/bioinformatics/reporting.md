---
name: "reporting"
description: "Reproducible report generation for bioinformatics analyses using literate programming frameworks and QC aggregation."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Reporting Category Guide

Reproducible report generation for bioinformatics analyses using literate programming frameworks and QC aggregation.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/reporting/automated-qc-reports` — Generates standardized quality control reports by aggregating metrics from FastQC, alignment, and other tools using MultiQC. Use when summarizing QC metrics across samples, creating shareable quality reports, or building automated QC pipelines.
- `research/bioinformatics/reporting/figure-export` — Exports publication-ready figures in various formats with proper resolution, sizing, and typography. Use when preparing figures for journal submission, creating vector graphics for presentations, or ensuring consistent figure styling across analyses.
- `research/bioinformatics/reporting/jupyter-reports` — Creates reproducible Jupyter notebooks for bioinformatics analysis with parameterization using papermill. Use when generating automated analysis reports, running notebook-based pipelines, or creating shareable computational notebooks.
- `research/bioinformatics/reporting/quarto-reports` — Build reproducible scientific documents, presentations, and websites with Quarto supporting R, Python, Julia, and Observable JS. Use when creating reproducible reports with Quarto.
- `research/bioinformatics/reporting/rmarkdown-reports` — Create reproducible bioinformatics analysis reports with R Markdown including code, results, and visualizations in HTML, PDF, or Word format. Use when generating analysis reports with RMarkdown.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.