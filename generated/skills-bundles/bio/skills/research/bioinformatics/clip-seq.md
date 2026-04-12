---
name: "clip-seq"
description: "Analyze CLIP-seq data (CLIP, PAR-CLIP, iCLIP, eCLIP) to identify protein-RNA binding sites at nucleotide resolution for understanding post-transcriptional regulation."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Clip Seq Category Guide

Analyze CLIP-seq data (CLIP, PAR-CLIP, iCLIP, eCLIP) to identify protein-RNA binding sites at nucleotide resolution for understanding post-transcriptional regulation.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/clip-seq/binding-site-annotation` — Annotate CLIP-seq binding sites to genomic features including 3'UTR, 5'UTR, CDS, introns, and ncRNAs. Use when characterizing where an RBP binds in transcripts.
- `research/bioinformatics/clip-seq/clip-alignment` — Align CLIP-seq reads to the genome with crosslink site awareness. Use when mapping preprocessed CLIP reads for peak calling.
- `research/bioinformatics/clip-seq/clip-motif-analysis` — Identify enriched sequence motifs at CLIP-seq binding sites for RBP binding specificity. Use when characterizing the sequence preferences of an RNA-binding protein.
- `research/bioinformatics/clip-seq/clip-peak-calling` — Call protein-RNA binding site peaks from CLIP-seq data using CLIPper, PureCLIP, or Piranha. Use when identifying RBP binding sites from aligned CLIP reads.
- `research/bioinformatics/clip-seq/clip-preprocessing` — Preprocess CLIP-seq data including adapter trimming, UMI extraction, and PCR duplicate removal. Use when preparing raw CLIP, iCLIP, or eCLIP reads for peak calling.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.