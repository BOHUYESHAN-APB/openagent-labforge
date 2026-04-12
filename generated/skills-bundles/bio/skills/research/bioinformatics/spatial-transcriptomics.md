---
name: "spatial-transcriptomics"
description: "Analyze spatial transcriptomics data from Visium, Xenium, MERFISH, and other platforms using Squidpy and SpatialData."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Spatial Transcriptomics Category Guide

Analyze spatial transcriptomics data from Visium, Xenium, MERFISH, and other platforms using Squidpy and SpatialData.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/spatial-transcriptomics/image-analysis` — Process and analyze tissue images from spatial transcriptomics data using Squidpy. Extract image features, segment cells/nuclei, and compute morphological features from H&E or IF images. Use when processing tissue images for spatial transcriptomics.
- `research/bioinformatics/spatial-transcriptomics/spatial-communication` — Analyze cell-cell communication in spatial transcriptomics data using ligand-receptor analysis with Squidpy. Infer intercellular signaling, identify communication pathways, and visualize interaction networks. Use when analyzing cell-cell communication in spatial context.
- `research/bioinformatics/spatial-transcriptomics/spatial-data-io` — Load spatial transcriptomics data from Visium, Xenium, MERFISH, Slide-seq, and other platforms using Squidpy and SpatialData. Read Space Ranger outputs, convert formats, and access spatial coordinates. Use when loading Visium, Xenium, MERFISH, or other spatial data.
- `research/bioinformatics/spatial-transcriptomics/spatial-deconvolution` — Estimate cell type composition in spatial transcriptomics spots using reference-based deconvolution. Use cell2location, RCTD, SPOTlight, or Tangram to infer cell type proportions from scRNA-seq references. Use when estimating cell type composition in spatial spots.
- `research/bioinformatics/spatial-transcriptomics/spatial-domains` — Identify spatial domains and tissue regions in spatial transcriptomics data using Squidpy and Scanpy. Cluster spots considering both expression and spatial context to define anatomical regions. Use when identifying tissue domains or spatial regions.
- `research/bioinformatics/spatial-transcriptomics/spatial-multiomics` — Analyze high-resolution spatial platforms like Slide-seq, Stereo-seq, and Visium HD. Use when working with subcellular resolution or high-density spatial data.
- `research/bioinformatics/spatial-transcriptomics/spatial-neighbors` — Build spatial neighbor graphs for spatial transcriptomics data using Squidpy. Compute k-nearest neighbors, Delaunay triangulation, and radius-based connectivity for downstream spatial analyses. Use when building spatial neighborhood graphs.
- `research/bioinformatics/spatial-transcriptomics/spatial-preprocessing` — Quality control, filtering, normalization, and feature selection for spatial transcriptomics data. Calculate QC metrics, filter spots/cells, normalize counts, and identify highly variable genes. Use when filtering and normalizing spatial transcriptomics data.
- `research/bioinformatics/spatial-transcriptomics/spatial-proteomics` — Analyzes spatial proteomics data from CODEX, IMC, and MIBI platforms including cell segmentation and protein colocalization. Use when working with multiplexed imaging data, analyzing protein spatial patterns, or integrating spatial proteomics with transcriptomics.
- `research/bioinformatics/spatial-transcriptomics/spatial-statistics` — Compute spatial statistics for spatial transcriptomics data using Squidpy. Calculate Moran's I, Geary's C, spatial autocorrelation, co-occurrence analysis, and neighborhood enrichment. Use when computing spatial autocorrelation or co-occurrence statistics.
- `research/bioinformatics/spatial-transcriptomics/spatial-visualization` — Visualize spatial transcriptomics data using Squidpy and Scanpy. Create tissue plots with gene expression, clusters, and annotations overlaid on histology images. Use when visualizing spatial expression patterns.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.