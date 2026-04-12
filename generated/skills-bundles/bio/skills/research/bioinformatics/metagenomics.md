---
name: "metagenomics"
description: "Taxonomic profiling of metagenomic data using Kraken2 for k-mer based classification and MetaPhlAn for marker gene profiling. Includes abundance estimation with Bracken and functional profiling with HUMAnN."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Metagenomics Category Guide

Taxonomic profiling of metagenomic data using Kraken2 for k-mer based classification and MetaPhlAn for marker gene profiling. Includes abundance estimation with Bracken and functional profiling with HUMAnN.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/metagenomics/abundance-estimation` — Species abundance estimation using Bracken with Kraken2 output. Redistributes reads from higher taxonomic levels to species for more accurate estimates. Use when accurate species-level abundances are needed from Kraken2 classification output.
- `research/bioinformatics/metagenomics/amr-detection` — Detect antimicrobial resistance genes using AMRFinderPlus, ResFinder, and CARD. Screen isolates and metagenomes for resistance determinants. Use when characterizing resistance profiles in clinical isolates, surveillance samples, or metagenomic data.
- `research/bioinformatics/metagenomics/functional-profiling` — Profile functional potential of metagenomes using HUMAnN3 and similar tools. Use when obtaining pathway abundances, gene family counts, or functional annotations from metagenomic data.
- `research/bioinformatics/metagenomics/kraken-classification` — Taxonomic classification of metagenomic reads using Kraken2. Fast k-mer based classification against RefSeq database. Use when performing initial taxonomic classification of shotgun metagenomic reads before abundance estimation with Bracken.
- `research/bioinformatics/metagenomics/metagenome-visualization` — Visualize metagenomic profiles using R (phyloseq, microbiome) and Python (matplotlib, seaborn). Create stacked bar plots, heatmaps, PCA plots, and diversity analyses. Use when creating publication-quality figures from MetaPhlAn, Bracken, or other taxonomic profiling output.
- `research/bioinformatics/metagenomics/metaphlan-profiling` — Marker gene-based taxonomic profiling using MetaPhlAn 4. Provides accurate species-level relative abundances using clade-specific markers. Use when accurate taxonomic profiling is needed and computational resources are limited, or for comparison with HMP/other MetaPhlAn studies.
- `research/bioinformatics/metagenomics/strain-tracking` — Track bacterial strains using MASH, sourmash, fastANI, and inStrain. Compare genomes, detect contamination, and monitor strain-level variation. Use when needing sub-species resolution for outbreak tracking, transmission analysis, or within-host strain dynamics.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.