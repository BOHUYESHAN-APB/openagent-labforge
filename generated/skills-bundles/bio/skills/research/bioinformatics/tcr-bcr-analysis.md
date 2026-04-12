---
name: "tcr-bcr-analysis"
description: "Analyze T-cell receptor (TCR) and B-cell receptor (BCR) repertoires from bulk or single-cell sequencing data for immunology research, vaccine development, and cancer immunotherapy."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Tcr Bcr Analysis Category Guide

Analyze T-cell receptor (TCR) and B-cell receptor (BCR) repertoires from bulk or single-cell sequencing data for immunology research, vaccine development, and cancer immunotherapy.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/tcr-bcr-analysis/immcantation-analysis` — Analyze BCR repertoires for somatic hypermutation, clonal lineages, and B cell phylogenetics using the Immcantation framework. Use when studying B cell affinity maturation, germinal center dynamics, or antibody evolution.
- `research/bioinformatics/tcr-bcr-analysis/mixcr-analysis` — Perform V(D)J alignment and clonotype assembly from TCR-seq or BCR-seq data using MiXCR. Use when processing raw immune repertoire sequencing data to identify clonotypes and their frequencies.
- `research/bioinformatics/tcr-bcr-analysis/repertoire-visualization` — Create publication-quality visualizations of immune repertoire data including circos plots, clone tracking, diversity plots, and network graphs. Use when generating figures for repertoire comparisons, clonal dynamics, or V(D)J gene usage.
- `research/bioinformatics/tcr-bcr-analysis/scirpy-analysis` — Analyze single-cell TCR and BCR data integrated with gene expression using scirpy. Use when working with 10x Genomics VDJ data alongside scRNA-seq or when integrating immune receptor information with cell state analysis.
- `research/bioinformatics/tcr-bcr-analysis/vdjtools-analysis` — Calculate immune repertoire diversity metrics, compare samples, and track clonal dynamics using VDJtools. Use when analyzing repertoire diversity, finding shared clonotypes, or comparing immune profiles between conditions.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.