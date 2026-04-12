---
name: "genome-annotation"
description: "Annotate assembled genomes with gene predictions, functional assignments, repeat elements, non-coding RNAs, and annotation transfer between assemblies."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Genome Annotation Category Guide

Annotate assembled genomes with gene predictions, functional assignments, repeat elements, non-coding RNAs, and annotation transfer between assemblies.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/genome-annotation/annotation-transfer` — Transfer gene annotations between genome assemblies using Liftoff for same-species annotation liftover and MiniProt for cross-species protein-to-genome alignment. Enables rapid annotation of new assemblies using existing reference annotations. Use when annotating a new assembly of a species with an existing reference annotation or mapping annotations across related species.
- `research/bioinformatics/genome-annotation/eukaryotic-gene-prediction` — Predict protein-coding genes in eukaryotic genomes using BRAKER3 for combined RNA-seq and protein evidence, or GALBA for protein-only evidence. Runs Augustus with trained parameters for accurate gene models. Use when annotating a newly assembled eukaryotic genome or improving existing gene predictions.
- `research/bioinformatics/genome-annotation/functional-annotation` — Assign GO terms, KEGG orthologs, Pfam domains, and EC numbers to predicted proteins using eggNOG-mapper and InterProScan. Produces functional summaries for downstream pathway and enrichment analysis. Use when adding functional annotation to predicted genes or characterizing protein functions in a new genome.
- `research/bioinformatics/genome-annotation/ncrna-annotation` — Identify non-coding RNAs including tRNAs, rRNAs, snoRNAs, and regulatory RNAs using Infernal covariance model searches against Rfam and tRNAscan-SE for tRNA prediction. Use when performing genome-wide ncRNA annotation with assembly input producing GFF output.
- `research/bioinformatics/genome-annotation/prokaryotic-annotation` — Annotate bacterial and archaeal genomes with Bakta for comprehensive structural and functional annotation, or Prokka for lightweight annotation. Generates GFF3, GenBank, and FASTA outputs with NCBI-compatible locus tags. Use when annotating a newly assembled prokaryotic genome or preparing annotations for NCBI submission.
- `research/bioinformatics/genome-annotation/repeat-annotation` — Identify and classify repetitive elements and transposable elements using RepeatModeler for de novo repeat library construction and RepeatMasker for genome-wide repeat annotation. Quantify TE expression from RNA-seq with TEtranscripts. Use when masking repeats before gene prediction or analyzing transposable element activity.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.