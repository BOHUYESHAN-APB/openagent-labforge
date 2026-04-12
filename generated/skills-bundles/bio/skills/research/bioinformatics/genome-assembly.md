---
name: "genome-assembly"
description: "Assemble genomes and transcriptomes from sequencing reads using short-read, long-read, and hybrid approaches. Includes assembly quality assessment, polishing, scaffolding, and contamination detection."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Genome Assembly Category Guide

Assemble genomes and transcriptomes from sequencing reads using short-read, long-read, and hybrid approaches. Includes assembly quality assessment, polishing, scaffolding, and contamination detection.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/genome-assembly/assembly-polishing` — Polish genome assemblies to reduce errors using short reads (Pilon), long reads (Racon), or ONT-specific tools (medaka). Essential for improving long-read assembly accuracy. Use when improving assembly accuracy with polishing tools.
- `research/bioinformatics/genome-assembly/assembly-qc` — Assess genome assembly quality using QUAST for contiguity metrics and BUSCO for completeness. Essential for evaluating assembly success and comparing assemblers. Use when evaluating assembly completeness and quality.
- `research/bioinformatics/genome-assembly/contamination-detection` — Detect contamination and assess genome quality using CheckM, CheckM2, GTDB-Tk, and GUNC for metagenome-assembled genomes and isolate assemblies. Use when checking assemblies for contamination.
- `research/bioinformatics/genome-assembly/hifi-assembly` — High-quality genome assembly from PacBio HiFi reads using hifiasm with phasing support. Use when building reference-quality diploid assemblies from HiFi data, especially with trio or Hi-C phasing for fully resolved haplotypes.
- `research/bioinformatics/genome-assembly/long-read-assembly` — De novo genome assembly from Oxford Nanopore or PacBio long reads using Flye and Canu. Produces highly contiguous assemblies suitable for complete bacterial genomes and resolving complex regions. Use when assembling genomes from ONT or PacBio reads.
- `research/bioinformatics/genome-assembly/metagenome-assembly` — Metagenome assembly from long reads using metaFlye and metaSPAdes with binning strategies. Use when reconstructing genomes from microbial communities, recovering metagenome-assembled genomes (MAGs), or resolving strain-level variation in complex samples.
- `research/bioinformatics/genome-assembly/scaffolding` — Scaffold contigs into chromosome-level assemblies using Hi-C data with YaHS, 3D-DNA, SALSA2, and validate with BUSCO and contact maps. Use when scaffolding contigs to chromosome-level assemblies.
- `research/bioinformatics/genome-assembly/short-read-assembly` — De novo genome assembly from Illumina short reads using SPAdes. Covers bacterial, fungal, and small eukaryotic genome assembly, as well as metagenome and transcriptome assembly modes. Use when assembling genomes from Illumina reads.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.