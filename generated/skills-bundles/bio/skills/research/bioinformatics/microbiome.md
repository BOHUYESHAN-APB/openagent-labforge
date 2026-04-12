---
name: "microbiome"
description: "16S/ITS amplicon sequencing analysis from raw reads to differential abundance testing."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Microbiome Category Guide

16S/ITS amplicon sequencing analysis from raw reads to differential abundance testing.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/microbiome/amplicon-processing` — Amplicon sequence variant (ASV) inference from 16S rRNA or ITS amplicon sequencing using DADA2. Covers quality filtering, error learning, denoising, and chimera removal. Use when processing demultiplexed amplicon FASTQ files to generate an ASV table for downstream analysis.
- `research/bioinformatics/microbiome/differential-abundance` — Differential abundance testing for microbiome data using compositionally-aware methods like ALDEx2, ANCOM-BC2, and MaAsLin2. Use when identifying taxa that differ between experimental groups while accounting for the compositional nature of microbiome data.
- `research/bioinformatics/microbiome/diversity-analysis` — Alpha and beta diversity analysis for microbiome data. Calculate within-sample richness, evenness, and between-sample dissimilarity with phyloseq and vegan. Use when comparing community composition across samples or testing for group differences in microbiome structure.
- `research/bioinformatics/microbiome/functional-prediction` — Predict metagenome functional content from 16S rRNA marker gene data using PICRUSt2. Infer KEGG, MetaCyc, and EC abundances from ASV tables. Use when functional profiling is needed from 16S data without shotgun metagenomics sequencing.
- `research/bioinformatics/microbiome/qiime2-workflow` — QIIME2 command-line workflow for 16S/ITS amplicon analysis. Alternative to DADA2/phyloseq R workflow with built-in provenance tracking. Use when preferring CLI over R, needing reproducible provenance, or working within QIIME2 ecosystem.
- `research/bioinformatics/microbiome/taxonomy-assignment` — Taxonomic classification of ASVs using reference databases like SILVA, GTDB, or UNITE. Covers naive Bayes classifiers (DADA2, IDTAXA) and exact matching approaches. Use when assigning taxonomy to ASVs after DADA2 amplicon processing.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.