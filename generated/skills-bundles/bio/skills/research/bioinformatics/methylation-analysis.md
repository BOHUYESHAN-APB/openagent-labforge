---
name: "methylation-analysis"
description: "DNA methylation analysis using Bismark for bisulfite sequencing alignment, methylKit/bsseq for downstream analysis, and scipy/limma for per-CpG differential testing. Covers alignment, methylation calling, per-CpG statistical testing, and detection of differentially methylated regions (DMRs)."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Methylation Analysis Category Guide

DNA methylation analysis using Bismark for bisulfite sequencing alignment, methylKit/bsseq for downstream analysis, and scipy/limma for per-CpG differential testing. Covers alignment, methylation calling, per-CpG statistical testing, and detection of differentially methylated regions (DMRs).

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/methylation-analysis/bismark-alignment` — Bisulfite sequencing read alignment using Bismark with bowtie2/hisat2. Handles genome preparation and produces BAM files with methylation information. Use when aligning WGBS, RRBS, or other bisulfite-converted sequencing reads to a reference genome.
- `research/bioinformatics/methylation-analysis/differential-cpg-testing` — Per-CpG differential methylation testing from bisulfite sequencing count data or beta-value matrices. Covers beta and M-value computation, coverage filtering, statistical tests (Welch t-test, Mann-Whitney, limma, DSS beta-binomial), multiple testing correction, and effect size calculation. Use when comparing methylation at individual CpG sites between experimental groups from WGBS, RRBS, or targeted bisulfite sequencing.
- `research/bioinformatics/methylation-analysis/dmr-detection` — Differentially methylated region (DMR) detection using methylKit tiles, bsseq BSmooth, and DMRcate. Use when identifying contiguous genomic regions with methylation differences between experimental conditions or cell types.
- `research/bioinformatics/methylation-analysis/methylation-calling` — Extract methylation calls from Bismark BAM files using bismark_methylation_extractor. Generates per-cytosine reports for CpG, CHG, and CHH contexts. Use when extracting methylation levels from aligned bisulfite sequencing data for downstream analysis.
- `research/bioinformatics/methylation-analysis/methylkit-analysis` — DNA methylation analysis with methylKit in R. Import Bismark coverage files, filter by coverage, normalize samples, and perform statistical comparisons. Use when analyzing single-base methylation patterns, comparing samples, or preparing data for DMR detection.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.