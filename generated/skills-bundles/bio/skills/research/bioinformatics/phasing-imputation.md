---
name: "phasing-imputation"
description: "Phase haplotypes and impute missing genotypes using reference panels. Essential for GWAS, population genetics, and integrating array and sequencing data. Covers Beagle, SHAPEIT, and reference panel management."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Phasing Imputation Category Guide

Phase haplotypes and impute missing genotypes using reference panels. Essential for GWAS, population genetics, and integrating array and sequencing data. Covers Beagle, SHAPEIT, and reference panel management.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/phasing-imputation/genotype-imputation` — Impute missing genotypes using reference panels with Beagle or Minimac4. Use when increasing variant density for GWAS, harmonizing data across genotyping platforms, or inferring variants not directly typed in array data.
- `research/bioinformatics/phasing-imputation/haplotype-phasing` — Phase genotypes into haplotypes using Beagle or SHAPEIT. Resolves which alleles are inherited together on each chromosome. Use when preparing VCF files for imputation, HLA typing, or population genetic analyses requiring phased haplotypes.
- `research/bioinformatics/phasing-imputation/imputation-qc` — Quality control of phasing and imputation results. Filter by INFO scores, assess accuracy, and prepare imputed data for downstream analysis. Use when filtering low-quality imputed variants or validating imputation accuracy before GWAS.
- `research/bioinformatics/phasing-imputation/reference-panels` — Download, prepare, and manage reference panels for phasing and imputation. Covers 1000 Genomes, HRC, and TOPMed panels. Use when setting up imputation infrastructure or selecting appropriate reference panels for target populations.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.