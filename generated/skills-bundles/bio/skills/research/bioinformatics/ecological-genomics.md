---
name: "ecological-genomics"
description: "Analyze ecological and environmental genomics data. Covers eDNA metabarcoding, biodiversity metrics, community ecology, genotype-environment associations, conservation genetics, and molecular species delimitation."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Ecological Genomics Category Guide

Analyze ecological and environmental genomics data. Covers eDNA metabarcoding, biodiversity metrics, community ecology, genotype-environment associations, conservation genetics, and molecular species delimitation.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/ecological-genomics/biodiversity-metrics` — Calculates species richness, diversity, and turnover using the Hill number framework with iNEXT coverage-based rarefaction/extrapolation, asymptotic diversity estimation, and beta diversity partitioning (betapart turnover vs nestedness). Compares assemblages using coverage-standardized rather than size-standardized rarefaction. Use when quantifying biodiversity from species abundance or incidence data, comparing diversity across sites, or constructing rarefaction curves. Not for clinical 16S microbiome alpha/beta diversity (see microbiome/diversity-analysis).
- `research/bioinformatics/ecological-genomics/community-ecology` — Analyzes community composition using constrained ordination (CCA, RDA, db-RDA), variance partitioning (varpart), indicator species analysis (indicspecies multipatt), and distance-based environmental gradient methods with vegan. Links species composition to environmental explanatory variables. Use when testing how environmental gradients structure species communities, identifying habitat indicator taxa, or partitioning explained variation among predictors. Not for basic unconstrained ordination and PERMANOVA (see microbiome/diversity-analysis).
- `research/bioinformatics/ecological-genomics/conservation-genetics` — Assesses genetic health of populations for conservation using effective population size estimation (GONE2 for recent Ne trajectory, NeEstimator for contemporary Ne, Stairway Plot 2 and PSMC for historical Ne), F-statistics (hierfstat), runs of homozygosity (detectRUNS), and genetic diversity metrics. Use when estimating effective population size, detecting inbreeding or bottlenecks, or assessing genetic diversity in threatened species from microsatellite or SNP data.
- `research/bioinformatics/ecological-genomics/edna-metabarcoding` — Processes environmental DNA metabarcoding data from raw amplicon reads to species occurrence tables using OBITools3, DADA2, and taxonomic assignment against BOLD, MIDORI2, or MitoFish databases. Handles COI, 12S, rbcL, and ITS barcode regions with primer removal, denoising, chimera detection, and contamination filtering via decontam. Includes occupancy modeling (occumb) for detection probability correction. Use when analyzing eDNA from water, soil, or bulk samples for biodiversity monitoring. Not for 16S human microbiome (see microbiome/amplicon-processing).
- `research/bioinformatics/ecological-genomics/landscape-genomics` — Tests genotype-environment associations and identifies loci under local adaptation using LFMM2 (LEA), pcadapt outlier detection, OutFLANK Fst-based selection scans, and redundancy analysis. Detects adaptive genetic variation correlated with environmental variables while controlling for population structure. Use when identifying adaptive loci across environmental gradients, testing for signatures of local adaptation, or predicting genetic vulnerability to climate change with gradientForest.
- `research/bioinformatics/ecological-genomics/species-delimitation` — Delimits species boundaries from molecular data using distance-based (ASAP), tree-based (bPTP, GMYC), and coalescent (BPP) methods. Compares multiple delimitation results with delimtools. Use when delineating putative species from DNA barcoding data, resolving cryptic species complexes, or validating taxonomic assignments. Emphasizes multi-method consensus following integrative taxonomy best practice.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.