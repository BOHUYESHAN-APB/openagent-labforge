---
name: "sequence-io"
description: "Sequence file input/output operations using Biopython's Bio.SeqIO module. Handles reading, writing, and converting biological sequence files in 40+ formats including FASTA, FASTQ, GenBank, and specialized formats like ABI traces."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Sequence Io Category Guide

Sequence file input/output operations using Biopython's Bio.SeqIO module. Handles reading, writing, and converting biological sequence files in 40+ formats including FASTA, FASTQ, GenBank, and specialized formats like ABI traces.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/sequence-io/batch-processing` — Process multiple sequence files in batch using Biopython. Use when working with many files, merging/splitting sequences, or automating file operations across directories.
- `research/bioinformatics/sequence-io/compressed-files` — Read and write compressed sequence files (gzip, bzip2, BGZF) using Biopython. Use when working with .gz or .bz2 sequence files. Use BGZF for indexable compressed files.
- `research/bioinformatics/sequence-io/fastq-quality` — Work with FASTQ quality scores using Biopython. Use when analyzing read quality, filtering by quality, trimming low-quality bases, or generating quality reports.
- `research/bioinformatics/sequence-io/filter-sequences` — Filter and select sequences by criteria (length, ID, GC content, patterns) using Biopython. Use when subsetting sequences, removing unwanted records, or selecting by specific criteria.
- `research/bioinformatics/sequence-io/format-conversion` — Convert between sequence file formats (FASTA, FASTQ, GenBank, EMBL) using Biopython Bio.SeqIO. Use when changing file formats or preparing data for different tools.
- `research/bioinformatics/sequence-io/paired-end-fastq` — Handle paired-end FASTQ files (R1/R2) using Biopython. Use when working with Illumina paired reads, synchronizing pairs, interleaving/deinterleaving, or filtering paired data.
- `research/bioinformatics/sequence-io/read-sequences` — Read biological sequence files (FASTA, FASTQ, GenBank, EMBL, ABI, SFF) using Biopython Bio.SeqIO. Use when parsing sequence files, iterating multi-sequence files, random access to large files, or high-performance parsing.
- `research/bioinformatics/sequence-io/sequence-statistics` — Calculate sequence statistics (N50, length distribution, GC content, summary reports) using Biopython. Use when analyzing sequence datasets, generating QC reports, or comparing assemblies.
- `research/bioinformatics/sequence-io/write-sequences` — Write biological sequences to files (FASTA, FASTQ, GenBank, EMBL) using Biopython Bio.SeqIO. Use when saving sequences, creating new sequence files, or outputting modified records.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.