---
name: "population-genetics"
description: "Population genetic analysis using PLINK, Admixture, and scikit-allel. Covers GWAS, population structure analysis, selection statistics, and linkage disequilibrium calculations."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Population Genetics Category Guide

Population genetic analysis using PLINK, Admixture, and scikit-allel. Covers GWAS, population structure analysis, selection statistics, and linkage disequilibrium calculations.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/population-genetics/association-testing` — Genome-wide association studies (GWAS) with PLINK. Perform case-control and quantitative trait association testing using logistic/linear regression with covariates, generate Manhattan and QQ plots for result visualization. Use when running GWAS or association tests.
- `research/bioinformatics/population-genetics/linkage-disequilibrium` — Calculate linkage disequilibrium statistics (r², D'), perform LD pruning for population structure analysis, identify haplotype blocks, and visualize LD patterns using PLINK, scikit-allel, and LDBlockShow. Use when calculating LD or pruning variants.
- `research/bioinformatics/population-genetics/plink-basics` — PLINK file formats, format conversion, and quality control filtering for population genetics. Convert between VCF, BED/BIM/FAM, and PED/MAP formats, apply MAF, genotyping rate, and HWE filters using PLINK 1.9 and 2.0. Use when working with PLINK format files or running QC.
- `research/bioinformatics/population-genetics/population-structure` — Analyze population structure using PCA and admixture analysis with PLINK and ADMIXTURE. Identify population clusters, assess ancestry proportions, visualize genetic structure, and choose optimal K for admixture models. Use when analyzing population stratification with PCA or admixture.
- `research/bioinformatics/population-genetics/scikit-allel-analysis` — Python population genetics with scikit-allel. Read VCF files, compute allele frequencies, calculate diversity statistics, perform PCA, and run selection scans using GenotypeArray and HaplotypeArray data structures. Use when analyzing population genetics in Python.
- `research/bioinformatics/population-genetics/selection-statistics` — Detect signatures of natural selection using Fst, Tajima's D, iHS, XP-EHH, and other selection statistics. Calculate population differentiation, test for departures from neutrality, and identify selective sweeps with scikit-allel and vcftools. Use when computing selection signatures like Fst or Tajima's D.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.