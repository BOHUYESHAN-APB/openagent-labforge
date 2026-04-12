---
name: "long-read-sequencing"
description: "Analysis of long-read sequencing data from Oxford Nanopore and PacBio. Covers alignment with minimap2, polishing, variant calling with medaka and Clair3, and structural variant detection with Sniffles."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Long Read Sequencing Category Guide

Analysis of long-read sequencing data from Oxford Nanopore and PacBio. Covers alignment with minimap2, polishing, variant calling with medaka and Clair3, and structural variant detection with Sniffles.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/long-read-sequencing/basecalling` — Convert raw Nanopore signal data (FAST5/POD5) to nucleotide sequences using Dorado basecaller. Covers model selection, GPU acceleration, modified base detection, and quality filtering. Use when processing raw Nanopore data before alignment. Note: Guppy is deprecated; use Dorado for all new analyses.
- `research/bioinformatics/long-read-sequencing/clair3-variants` — Deep learning-based variant calling from long reads using Clair3 for SNPs and small indels. Use when calling germline variants from ONT or PacBio alignments, particularly when high accuracy is needed for clinical or research applications.
- `research/bioinformatics/long-read-sequencing/isoseq-analysis` — Analyze PacBio Iso-Seq data for full-length isoform discovery and quantification. Use when characterizing transcript diversity or identifying novel splice variants.
- `research/bioinformatics/long-read-sequencing/long-read-alignment` — Align long reads using minimap2 for Oxford Nanopore and PacBio data. Supports various presets for different read types and applications. Use when aligning ONT or PacBio reads to a reference genome for variant calling, SV detection, or coverage analysis.
- `research/bioinformatics/long-read-sequencing/long-read-qc` — Quality control for long-read sequencing data using NanoPlot, NanoStat, and chopper. Generate QC reports, filter reads by length and quality, and visualize read characteristics. Use when assessing ONT or PacBio run quality or filtering reads before assembly or alignment.
- `research/bioinformatics/long-read-sequencing/medaka-polishing` — Polish assemblies and call variants from Oxford Nanopore data using medaka. Uses neural networks trained on specific basecaller versions. Use when improving ONT-only assemblies or calling variants from Nanopore data without short-read polishing.
- `research/bioinformatics/long-read-sequencing/nanopore-methylation` — Calls DNA methylation from Oxford Nanopore sequencing data using signal-level analysis. Use when detecting 5mC or 6mA modifications directly from nanopore reads without bisulfite conversion.
- `research/bioinformatics/long-read-sequencing/structural-variants` — Detect structural variants from long-read alignments using Sniffles, cuteSV, and SVIM. Use when detecting deletions, insertions, inversions, translocations, or complex rearrangements from ONT or PacBio data, especially those missed by short-read methods.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.