---
name: "restriction-analysis"
description: "Restriction enzyme analysis using Biopython Bio.Restriction. Find cut sites, create restriction maps, select enzymes for cloning, and predict fragment sizes. Includes data for 800+ enzymes from REBASE."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Restriction Analysis Category Guide

Restriction enzyme analysis using Biopython Bio.Restriction. Find cut sites, create restriction maps, select enzymes for cloning, and predict fragment sizes. Includes data for 800+ enzymes from REBASE.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/restriction-analysis/enzyme-selection` — Select restriction enzymes by criteria using Biopython Bio.Restriction. Find enzymes that cut once, don't cut, produce specific overhangs, are commercially available, or have compatible ends for cloning. Use when selecting restriction enzymes for cloning or analysis.
- `research/bioinformatics/restriction-analysis/fragment-analysis` — Analyze restriction digest fragments using Biopython Bio.Restriction. Predict fragment sizes, get fragment sequences, simulate gel electrophoresis patterns, and perform double digests. Use when analyzing restriction digest fragment patterns.
- `research/bioinformatics/restriction-analysis/restriction-mapping` — Create restriction maps showing enzyme cut positions on DNA sequences using Biopython Bio.Restriction. Visualize cut sites, calculate distances between sites, and generate text or graphical maps. Use when creating or analyzing restriction maps.
- `research/bioinformatics/restriction-analysis/restriction-sites` — Find restriction enzyme cut sites in DNA sequences using Biopython Bio.Restriction. Search with single enzymes, batches of enzymes, or commercially available enzyme sets. Returns cut positions for linear or circular DNA. Use when finding restriction enzyme cut sites in sequences.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.