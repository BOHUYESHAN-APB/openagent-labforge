---
name: "rna-structure"
description: "Predict and analyze RNA secondary structures, search for non-coding RNA families, and interpret experimental structure probing data."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Rna Structure Category Guide

Predict and analyze RNA secondary structures, search for non-coding RNA families, and interpret experimental structure probing data.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/rna-structure/ncrna-search` — Searches for non-coding RNA homologs and classifies RNA families using Infernal covariance model searches against the Rfam database. Identifies structured RNAs by sequence and secondary structure conservation. Use when querying sequences against Rfam, building custom covariance models for novel RNA families, or classifying non-coding transcripts by family.
- `research/bioinformatics/rna-structure/secondary-structure-prediction` — Predicts RNA secondary structures using minimum free energy folding and partition function analysis with ViennaRNA (RNAfold, RNAalifold, RNAcofold). Computes base-pair probabilities, centroid structures, and consensus structures from alignments. Use when predicting RNA folding, evaluating structural stability, or comparing structures across homologs.
- `research/bioinformatics/rna-structure/structure-probing` — Analyzes experimental RNA structure probing data from SHAPE-MaP and DMS-MaPseq experiments using ShapeMapper2. Converts mutation rates to per-nucleotide reactivity profiles that constrain structure prediction. Use when processing SHAPE-MaP or DMS-MaPseq sequencing data to obtain experimental RNA structure information.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.