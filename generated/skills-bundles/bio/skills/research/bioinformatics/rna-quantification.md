---
name: "rna-quantification"
description: "Quantify gene and transcript expression from RNA-seq data. Covers BAM-based counting with featureCounts and alignment-free quantification with Salmon/kallisto, plus import to R for differential expression."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Rna Quantification Category Guide

Quantify gene and transcript expression from RNA-seq data. Covers BAM-based counting with featureCounts and alignment-free quantification with Salmon/kallisto, plus import to R for differential expression.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/rna-quantification/alignment-free-quant` — Quantify transcript expression using pseudo-alignment with Salmon or kallisto. Use when quantifying transcripts with Salmon or kallisto.
- `research/bioinformatics/rna-quantification/count-matrix-qc` — Quality control and exploration of RNA-seq count matrices before differential expression. Check for outliers, batch effects, and sample relationships. Use when assessing count matrix quality before DE analysis.
- `research/bioinformatics/rna-quantification/featurecounts-counting` — Count reads per gene from aligned BAM files using Subread featureCounts. Use when processing BAM files from STAR/HISAT2 to generate gene-level counts for DESeq2/edgeR.
- `research/bioinformatics/rna-quantification/tximport-workflow` — Import transcript-level quantifications from Salmon/kallisto into R for gene-level analysis with DESeq2/edgeR using tximport or tximeta. Use when importing transcript counts into R for DESeq2/edgeR.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.