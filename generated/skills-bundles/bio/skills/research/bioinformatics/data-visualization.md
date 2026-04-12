---
name: "data-visualization"
description: "Publication-quality data visualization for bioinformatics using ggplot2 and matplotlib with best practices for scientific figures."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Data Visualization Category Guide

Publication-quality data visualization for bioinformatics using ggplot2 and matplotlib with best practices for scientific figures.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/data-visualization/circos-plots` — Create circular genome visualizations with Circos and pyCircos. Display multi-track data including ideograms, genes, variants, CNVs, and interaction arcs. Use when creating circular genome visualizations.
- `research/bioinformatics/data-visualization/color-palettes` — Select and apply colorblind-friendly palettes for scientific figures using viridis, RColorBrewer, and custom color schemes. Use when selecting colorblind-friendly palettes for figures.
- `research/bioinformatics/data-visualization/genome-browser-tracks` — Generate genome browser visualizations using pyGenomeTracks or IGV batch scripting for publication figures. Use when creating publication figures of genomic regions with multiple data tracks.
- `research/bioinformatics/data-visualization/genome-tracks` — Create genome browser-style visualizations showing multiple data tracks (coverage, peaks, genes) using pyGenomeTracks, Gviz, and IGV. Use when visualizing genomic data at specific loci with multiple aligned tracks.
- `research/bioinformatics/data-visualization/ggplot2-fundamentals` — Create publication-quality scientific figures with ggplot2 including scatter plots, boxplots, heatmaps, and multi-panel layouts. Use when creating static figures for papers, presentations, or reports in R.
- `research/bioinformatics/data-visualization/heatmaps-clustering` — Create clustered heatmaps with row/column annotations using ComplexHeatmap, pheatmap, and seaborn for gene expression and omics data visualization. Use when visualizing expression patterns across samples or identifying co-expressed gene clusters.
- `research/bioinformatics/data-visualization/interactive-visualization` — Create interactive HTML plots with plotly and bokeh for exploratory data analysis and web-based sharing of omics visualizations. Use when building zoomable, hoverable plots for data exploration or web dashboards.
- `research/bioinformatics/data-visualization/multipanel-figures` — Combine multiple plots into publication-ready multi-panel figures using patchwork, cowplot, or matplotlib GridSpec with shared legends and panel labels. Use when combining multiple plots into publication figures.
- `research/bioinformatics/data-visualization/network-visualization` — Visualize biological networks including gene regulatory networks, protein interaction networks, and co-expression modules using NetworkX, PyVis, and Cytoscape automation. Produces interactive and publication-quality network figures. Use when creating network diagrams from interaction data, GRN results, or co-expression modules.
- `research/bioinformatics/data-visualization/specialized-omics-plots` — Reusable plotting functions for common omics visualizations. Custom ggplot2/matplotlib implementations of volcano, MA, PCA, enrichment dotplots, boxplots, and survival curves. Use when creating volcano, MA, or enrichment plots.
- `research/bioinformatics/data-visualization/upset-plots` — Create UpSet plots to visualize set intersections as an alternative to Venn diagrams using UpSetR or upsetplot. Use when comparing overlapping gene sets, peak sets, or sample groups with more than 3 sets.
- `research/bioinformatics/data-visualization/volcano-customization` — Create publication-ready volcano plots with custom thresholds, gene labels, and highlighting using ggplot2, EnhancedVolcano, or matplotlib. Use when visualizing differential expression or association results with gene annotations.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.