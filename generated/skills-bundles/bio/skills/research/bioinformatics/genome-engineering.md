---
name: "genome-engineering"
description: "Design CRISPR guides, predict off-targets, and create templates for genome editing experiments including Cas9/Cas12a knockouts, prime editing, base editing, and HDR knock-ins."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Genome Engineering Category Guide

Design CRISPR guides, predict off-targets, and create templates for genome editing experiments including Cas9/Cas12a knockouts, prime editing, base editing, and HDR knock-ins.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/genome-engineering/base-editing-design` — Design guides for cytosine and adenine base editing using editing window optimization and BE-Hive outcome prediction. Select optimal positions for C-to-T or A-to-G conversions without double-strand breaks. Use when designing base editor experiments for precise nucleotide changes.
- `research/bioinformatics/genome-engineering/grna-design` — Design guide RNAs for CRISPR-Cas9/Cas12a experiments using CRISPRscan and local scoring algorithms. Score guides for on-target activity using Rule Set 2 and Azimuth models. Use when designing sgRNAs for gene knockout, activation, or repression experiments.
- `research/bioinformatics/genome-engineering/hdr-template-design` — Design homology-directed repair donor templates for CRISPR knock-ins using primer3-py. Create ssODN, dsDNA, or plasmid templates with optimized homology arms. Use when designing donor templates for precise insertions, tagging, or allele replacement.
- `research/bioinformatics/genome-engineering/off-target-prediction` — Predict CRISPR off-target sites using Cas-OFFinder and CFD scoring algorithms. Identify potential unintended cleavage sites genome-wide and assess guide specificity. Use when evaluating guide RNA specificity or selecting guides with minimal off-target risk.
- `research/bioinformatics/genome-engineering/prime-editing-design` — Design pegRNAs for prime editing using PrimeDesign algorithms. Generate spacer, PBS, and RT template sequences for precise genomic modifications without double-strand breaks. Use when designing prime editing experiments for precise insertions, deletions, or point mutations.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.