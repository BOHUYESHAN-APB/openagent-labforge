---
name: "alignment"
description: "Pairwise and multiple sequence alignment: running MSA tools (MAFFT, MUSCLE5, ClustalOmega, T-Coffee), BioPython pairwise alignment, alignment I/O, and post-alignment analysis. Distinct from alignment-files which handles read-to-reference alignments (SAM/BAM)."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Alignment Category Guide

Pairwise and multiple sequence alignment: running MSA tools (MAFFT, MUSCLE5, ClustalOmega, T-Coffee), BioPython pairwise alignment, alignment I/O, and post-alignment analysis. Distinct from alignment-files which handles read-to-reference alignments (SAM/BAM).

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/alignment/alignment-io` — Read, write, and convert multiple sequence alignment files using Biopython Bio.AlignIO. Supports Clustal, PHYLIP, Stockholm, FASTA, Nexus, and other alignment formats for phylogenetics and conservation analysis. Use when reading, writing, or converting alignment file formats.
- `research/bioinformatics/alignment/msa-parsing` — Parse and analyze multiple sequence alignments using Biopython. Extract sequences, identify conserved regions, analyze gaps, work with annotations, and manipulate alignment data for downstream analysis. Use when parsing or manipulating multiple sequence alignments.
- `research/bioinformatics/alignment/msa-statistics` — Calculate alignment statistics including sequence identity, conservation scores, substitution matrices, and similarity metrics. Use when comparing alignment quality, measuring sequence divergence, and analyzing evolutionary patterns.
- `research/bioinformatics/alignment/multiple-alignment` — Perform multiple sequence alignment using MAFFT, MUSCLE5, ClustalOmega, or T-Coffee. Guides tool and algorithm selection based on dataset size, sequence divergence, and downstream application. Use when aligning three or more homologous sequences for phylogenetics, conservation analysis, or evolutionary studies.
- `research/bioinformatics/alignment/pairwise-alignment` — Perform pairwise sequence alignment using Biopython Bio.Align.PairwiseAligner. Use when comparing two sequences, finding optimal alignments, scoring similarity, and identifying local or global matches between DNA, RNA, or protein sequences.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.