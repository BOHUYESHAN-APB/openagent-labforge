---
name: "single-cell"
description: "Single-cell RNA-seq analysis using Seurat (R) and Scanpy (Python). Covers the complete workflow from loading data through quality control, normalization, clustering, marker gene identification, and cell type annotation."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Single Cell Category Guide

Single-cell RNA-seq analysis using Seurat (R) and Scanpy (Python). Covers the complete workflow from loading data through quality control, normalization, clustering, marker gene identification, and cell type annotation.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/single-cell/batch-integration` — Integrate multiple scRNA-seq samples/batches using Harmony, scVI, Seurat anchors, and fastMNN. Remove technical variation while preserving biological differences. Use when integrating multiple scRNA-seq batches or datasets.
- `research/bioinformatics/single-cell/cell-annotation` — Automated cell type annotation using reference-based methods including CellTypist, scPred, SingleR, and Azimuth for consistent, reproducible cell labeling. Use when automatically annotating cell types using reference datasets.
- `research/bioinformatics/single-cell/cell-communication` — Infer cell-cell communication networks from scRNA-seq data using CellChat, NicheNet, and LIANA for ligand-receptor interaction analysis. Use when inferring ligand-receptor interactions between cell types.
- `research/bioinformatics/single-cell/clustering` — Dimensionality reduction and clustering for single-cell RNA-seq using Seurat (R) and Scanpy (Python). Use for running PCA, computing neighbors, clustering with Leiden/Louvain algorithms, generating UMAP/tSNE embeddings, and visualizing clusters. Use when performing dimensionality reduction and clustering on single-cell data.
- `research/bioinformatics/single-cell/data-io` — Read, write, and create single-cell data objects using Seurat (R) and Scanpy (Python). Use for loading 10X Genomics data, importing/exporting h5ad and RDS files, creating Seurat objects and AnnData objects, and converting between formats. Use when loading, saving, or converting single-cell data formats.
- `research/bioinformatics/single-cell/doublet-detection` — Detect and remove doublets (multiple cells captured in one droplet) from single-cell RNA-seq data. Uses Scrublet (Python), DoubletFinder (R), and scDblFinder (R). Essential QC step before clustering to avoid artificial cell populations. Use when identifying and removing doublets from scRNA-seq data.
- `research/bioinformatics/single-cell/lineage-tracing` — Reconstruct cell lineage trees from CRISPR barcode tracing or mitochondrial mutations. Use when studying clonal dynamics, cell fate decisions, or developmental trajectories.
- `research/bioinformatics/single-cell/markers-annotation` — Find marker genes and annotate cell types in single-cell RNA-seq using Seurat (R) and Scanpy (Python). Use for differential expression between clusters, identifying cluster-specific markers, scoring gene sets, and assigning cell type labels. Use when finding marker genes and annotating clusters.
- `research/bioinformatics/single-cell/metabolite-communication` — Analyze metabolite-mediated cell-cell communication using MeboCost for metabolic signaling inference between cell types. Predict metabolite secretion and sensing patterns from scRNA-seq data. Use when studying metabolic crosstalk between cell populations or metabolite-receptor interactions.
- `research/bioinformatics/single-cell/multimodal-integration` — Analyze multi-modal single-cell data (CITE-seq, Multiome, spatial). Use when working with data that measures multiple modalities per cell like RNA + protein or RNA + ATAC. Use when analyzing CITE-seq, Multiome, or other multi-modal single-cell data.
- `research/bioinformatics/single-cell/perturb-seq` — Analyze Perturb-seq and CROP-seq CRISPR screening data integrated with scRNA-seq. Use when identifying gene function through pooled genetic perturbations in single cells.
- `research/bioinformatics/single-cell/preprocessing` — Quality control, filtering, and normalization for single-cell RNA-seq using Seurat (R) and Scanpy (Python). Use for calculating QC metrics, filtering cells and genes, normalizing counts, identifying highly variable genes, and scaling data. Use when filtering, normalizing, and selecting features in single-cell data.
- `research/bioinformatics/single-cell/scatac-analysis` — Single-cell ATAC-seq analysis with Signac (R/Seurat) and ArchR. Process 10X Genomics scATAC data, perform QC, dimensionality reduction, clustering, peak calling, and motif activity scoring with chromVAR. Use when analyzing single-cell ATAC-seq data.
- `research/bioinformatics/single-cell/trajectory-inference` — Infer developmental trajectories and pseudotime from single-cell RNA-seq data using Monocle3, Slingshot, and scVelo for RNA velocity analysis. Use when inferring developmental trajectories or pseudotime.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.