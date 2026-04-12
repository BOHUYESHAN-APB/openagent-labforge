---
name: "read-qc"
description: "Read quality control and preprocessing - the first step in any NGS workflow. Covers quality assessment with FastQC/MultiQC, adapter trimming, quality filtering, and contamination screening."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Read Qc Category Guide

Read quality control and preprocessing - the first step in any NGS workflow. Covers quality assessment with FastQC/MultiQC, adapter trimming, quality filtering, and contamination screening.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/read-qc/adapter-trimming` — Remove sequencing adapters from FASTQ files using Cutadapt and Trimmomatic. Supports single-end and paired-end reads, Illumina TruSeq, Nextera, and custom adapter sequences. Use when FastQC shows adapter contamination or before alignment of short reads.
- `research/bioinformatics/read-qc/contamination-screening` — Detect sample contamination and cross-species reads using FastQ Screen. Screen reads against multiple reference genomes to identify bacterial, viral, adapter, or sample swap contamination. Use when suspecting cross-contamination or working with samples prone to microbial contamination.
- `research/bioinformatics/read-qc/fastp-workflow` — All-in-one read preprocessing with fastp including adapter trimming, quality filtering, deduplication, base correction, and HTML report generation. Use when preprocessing Illumina data and wanting a single fast tool instead of separate Cutadapt, Trimmomatic, and FastQC steps.
- `research/bioinformatics/read-qc/quality-filtering` — Filter reads by quality scores, length, and N content using Trimmomatic and fastp. Apply sliding window trimming, remove low-quality bases from read ends, and discard reads below thresholds. Use when reads have poor quality tails or require minimum quality for downstream analysis.
- `research/bioinformatics/read-qc/quality-reports` — Generate and interpret quality reports from FASTQ files using FastQC and MultiQC. Assess per-base quality, adapter content, GC bias, duplication levels, and overrepresented sequences. Use when performing initial QC on raw sequencing data or validating preprocessing results.
- `research/bioinformatics/read-qc/rnaseq-qc` — RNA-seq specific quality control including rRNA contamination detection, strandedness verification, gene body coverage, and transcript integrity metrics. Use when validating RNA-seq libraries before differential expression analysis.
- `research/bioinformatics/read-qc/umi-processing` — Extract, process, and deduplicate reads using Unique Molecular Identifiers (UMIs) with umi_tools. Use when library prep includes UMIs and accurate molecule counting is needed, such as in single-cell RNA-seq, low-input RNA-seq, or targeted sequencing to distinguish PCR from biological duplicates.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.