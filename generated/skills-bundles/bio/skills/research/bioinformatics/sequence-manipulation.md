---
name: "sequence-manipulation"
description: "Working with sequence data programmatically using Biopython's Bio.Seq and Bio.SeqUtils modules. Handles transcription, translation, reverse complement, motif finding, and sequence property calculations."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Sequence Manipulation Category Guide

Working with sequence data programmatically using Biopython's Bio.Seq and Bio.SeqUtils modules. Handles transcription, translation, reverse complement, motif finding, and sequence property calculations.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/sequence-manipulation/codon-usage` — Analyze codon usage, calculate CAI (Codon Adaptation Index), and examine synonymous codon bias using Biopython. Use when analyzing coding sequences for expression optimization or evolutionary analysis.
- `research/bioinformatics/sequence-manipulation/motif-search` — Find patterns, motifs, and subsequences in biological sequences using Biopython. Use when searching for transcription factor binding sites, regulatory elements, or any sequence pattern. For restriction enzyme analysis, use the restriction-analysis skill.
- `research/bioinformatics/sequence-manipulation/reverse-complement` — Generate reverse complements and complements of DNA/RNA sequences using Biopython. Use when working with opposite strands, primer design, or converting between template and coding strands.
- `research/bioinformatics/sequence-manipulation/seq-objects` — Create and manipulate Seq, MutableSeq, and SeqRecord objects using Biopython. Use when creating sequences from strings, modifying sequence data in-place, or building annotated sequence records.
- `research/bioinformatics/sequence-manipulation/sequence-properties` — Calculate sequence properties like GC content, molecular weight, isoelectric point, and GC skew using Biopython. Use when analyzing sequence composition, computing physical properties, or comparing sequences.
- `research/bioinformatics/sequence-manipulation/sequence-slicing` — Slice, extract, and concatenate biological sequences using Biopython. Use when extracting subsequences, joining sequences, or manipulating sequence regions by position.
- `research/bioinformatics/sequence-manipulation/transcription-translation` — Transcribe DNA to RNA and translate to protein using Biopython. Use when converting between DNA, RNA, and protein sequences, finding ORFs, or using alternative codon tables.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.