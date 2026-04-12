---
name: "small-rna-seq"
description: "Analyze small RNA sequencing data including miRNA, piRNA, and snoRNA for discovery, quantification, and differential expression analysis."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Small Rna Seq Category Guide

Analyze small RNA sequencing data including miRNA, piRNA, and snoRNA for discovery, quantification, and differential expression analysis.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/small-rna-seq/differential-mirna` — Perform differential expression analysis of miRNAs between conditions using DESeq2 or edgeR with small RNA-specific considerations. Use when identifying miRNAs that change between treatment groups, disease states, or developmental stages.
- `research/bioinformatics/small-rna-seq/mirdeep2-analysis` — Discover novel miRNAs and quantify known miRNAs using miRDeep2 de novo prediction from small RNA-seq data. Use when identifying new miRNAs or performing comprehensive miRNA profiling with discovery.
- `research/bioinformatics/small-rna-seq/mirge3-analysis` — Fast miRNA quantification with isomiR detection and A-to-I editing analysis using miRge3. Use when quantifying known miRNAs quickly or analyzing isomiR variants and RNA editing.
- `research/bioinformatics/small-rna-seq/smrna-preprocessing` — Preprocess small RNA sequencing data with adapter trimming and size selection optimized for miRNA, piRNA, and other small RNAs. Use when preparing small RNA-seq reads for downstream quantification or discovery analysis.
- `research/bioinformatics/small-rna-seq/target-prediction` — Predict miRNA target genes using sequence-based algorithms and database lookups. Use when identifying potential mRNA targets of differentially expressed or functionally important miRNAs.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.