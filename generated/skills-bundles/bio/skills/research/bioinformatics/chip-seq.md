---
name: "chip-seq"
description: "ChIP-seq analysis using MACS3 and HOMER for peak calling, ChIPseeker for annotation, and DiffBind for differential binding. Used to study protein-DNA interactions including transcription factor binding and histone modifications."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Chip Seq Category Guide

ChIP-seq analysis using MACS3 and HOMER for peak calling, ChIPseeker for annotation, and DiffBind for differential binding. Used to study protein-DNA interactions including transcription factor binding and histone modifications.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/chip-seq/chipseq-qc` — ChIP-seq quality control metrics including FRiP (Fraction of Reads in Peaks), cross-correlation analysis (NSC/RSC), library complexity, and IDR (Irreproducibility Discovery Rate) for replicate concordance. Use to assess experiment quality before downstream analysis. Use when assessing ChIP-seq data quality metrics.
- `research/bioinformatics/chip-seq/chipseq-visualization` — Visualize ChIP-seq data using deepTools, Gviz, and ChIPseeker. Create heatmaps, profile plots, and genome browser tracks. Visualize signal around peaks, TSS, or custom regions. Use when visualizing ChIP-seq signal and peaks.
- `research/bioinformatics/chip-seq/differential-binding` — Identifies differentially bound ChIP-seq regions between conditions using DiffBind (from BAMs), DESeq2, or PyDESeq2 (from count matrices). Handles normalization, statistical testing, and fold-change estimation with ChIP-seq-specific considerations. Use when comparing ChIP-seq binding between experimental conditions.
- `research/bioinformatics/chip-seq/motif-analysis` — De novo motif discovery and known motif enrichment analysis using HOMER and MEME-ChIP. Identify transcription factor binding motifs in ChIP-seq, ATAC-seq, or other genomic peak data. Use when finding enriched DNA motifs in peak sequences.
- `research/bioinformatics/chip-seq/peak-annotation` — Annotate ChIP-seq peaks to genomic features and nearest genes. Classify peaks as promoter, exon, intron, or intergenic using ChIPseeker (R), HOMER annotatePeaks.pl (CLI), or Python (pandas/pyranges). Supports pre-built annotation databases and custom GTF files. Handles promoter definition, feature priority, category collapsing, and signed distance-to-TSS. Use when assigning genomic context to ChIP-seq peaks or linking peaks to target genes.
- `research/bioinformatics/chip-seq/peak-calling` — ChIP-seq peak calling using MACS3 and HOMER findPeaks. Call narrow peaks for transcription factors or broad peaks for histone modifications. Supports single-caller and multi-caller consensus approaches, input control, fragment size modeling, and various output formats. Use when calling peaks from ChIP-seq alignments.
- `research/bioinformatics/chip-seq/super-enhancers` — Identifies super-enhancers from H3K27ac ChIP-seq data using ROSE and related tools. Use when studying cell identity genes, cancer-associated regulatory elements, or master transcription factor binding regions that cluster into large enhancer domains.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.