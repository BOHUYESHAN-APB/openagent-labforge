---
name: "genome-intervals"
description: "Genomic interval operations using BEDTools, pybedtools, and pyBigWig. Covers BED file manipulation, interval arithmetic, GTF/GFF parsing, coverage analysis, and bigWig track generation."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Genome Intervals Category Guide

Genomic interval operations using BEDTools, pybedtools, and pyBigWig. Covers BED file manipulation, interval arithmetic, GTF/GFF parsing, coverage analysis, and bigWig track generation.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/genome-intervals/bed-file-basics` — BED file format fundamentals, creation, validation, and basic operations. Covers BED3 through BED12 formats, coordinate systems, sorting, and format conversion using bedtools and pybedtools. Use when working with genomic coordinates or preparing interval files for downstream tools.
- `research/bioinformatics/genome-intervals/bedgraph-handling` — Create, manipulate, and convert bedGraph files for genome browser visualization. Covers bedGraph format, conversion to/from bigWig, normalization, and signal processing. Use when handling coverage and signal tracks from ChIP-seq, ATAC-seq, or RNA-seq.
- `research/bioinformatics/genome-intervals/bigwig-tracks` — Create and read bigWig browser tracks for visualizing continuous genomic data. Convert bedGraph to bigWig, extract signal values, and generate coverage tracks using UCSC tools and pyBigWig. Use when preparing coverage tracks for genome browsers or extracting signal at specific regions.
- `research/bioinformatics/genome-intervals/coverage-analysis` — Calculate read depth and coverage across genomic intervals using bedtools genomecov and coverage. Generate bedGraph files, compute per-base depth, and summarize coverage statistics. Use when assessing sequencing depth, creating coverage tracks, or evaluating target capture efficiency.
- `research/bioinformatics/genome-intervals/gtf-gff-handling` — Parse, query, and convert GTF and GFF3 annotation files. Extract gene, transcript, and exon coordinates using gffread, gtfparse, and gffutils. Use when extracting specific features from gene annotations or converting between annotation formats.
- `research/bioinformatics/genome-intervals/interval-arithmetic` — Core interval arithmetic operations including intersect, subtract, merge, complement, map, and groupby using bedtools and pybedtools. Use when finding overlapping regions, removing overlaps, combining adjacent intervals, or transferring annotations between interval files.
- `research/bioinformatics/genome-intervals/proximity-operations` — Find nearest features, search within windows, and extend intervals using closest, window, flank, and slop operations. Use when performing TSS proximity analysis, assigning enhancers to genes, defining promoter regions, or finding nearby genomic features.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.