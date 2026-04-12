---
name: "hi-c-analysis"
description: "Analyze Hi-C and chromosome conformation capture data using cooler, cooltools, pairtools, and HiCExplorer."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Hi C Analysis Category Guide

Analyze Hi-C and chromosome conformation capture data using cooler, cooltools, pairtools, and HiCExplorer.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/hi-c-analysis/compartment-analysis` — Detect A/B compartments from Hi-C data using cooltools and eigenvector decomposition. Identify active (A) and inactive (B) chromatin compartments from contact matrices. Use when identifying A/B compartments from Hi-C data.
- `research/bioinformatics/hi-c-analysis/contact-pairs` — Process Hi-C read pairs using pairtools. Parse alignments, filter duplicates, classify pairs, and generate contact statistics from Hi-C sequencing data. Use when processing raw Hi-C read pairs.
- `research/bioinformatics/hi-c-analysis/hic-data-io` — Load, convert, and manipulate Hi-C contact matrices using cooler format. Read .cool/.mcool files, convert from .hic format, access matrix data, and export to different formats. Use when loading or converting Hi-C contact matrices.
- `research/bioinformatics/hi-c-analysis/hic-differential` — Compare Hi-C contact matrices between conditions to identify differential chromatin interactions. Compute log2 fold changes, statistical significance, and visualize differential contact maps. Use when comparing Hi-C contacts between conditions.
- `research/bioinformatics/hi-c-analysis/hic-visualization` — Visualize Hi-C contact matrices, TADs, loops, and genomic features using matplotlib, cooltools, and HiCExplorer. Create triangle plots, virtual 4C, and multi-track figures. Use when visualizing contact matrices or genomic features.
- `research/bioinformatics/hi-c-analysis/loop-calling` — Detect chromatin loops and point interactions from Hi-C data using cooltools, chromosight, and HiCCUPS-like methods. Identify CTCF-mediated loops and enhancer-promoter contacts. Use when detecting chromatin loops from Hi-C data.
- `research/bioinformatics/hi-c-analysis/matrix-operations` — Balance, normalize, and transform Hi-C contact matrices using cooler and cooltools. Apply iterative correction (ICE), compute expected values, and generate observed/expected matrices. Use when normalizing or transforming Hi-C matrices.
- `research/bioinformatics/hi-c-analysis/tad-detection` — Call topologically associating domains (TADs) from Hi-C data using insulation score, HiCExplorer, and other methods. Identify domain boundaries and hierarchical domain structure. Use when calling TADs from Hi-C insulation scores.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.