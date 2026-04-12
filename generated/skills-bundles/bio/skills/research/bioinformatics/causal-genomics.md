---
name: "causal-genomics"
description: "Infer causal relationships from genetic association data using Mendelian randomization, colocalization, and mediation analysis."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Causal Genomics Category Guide

Infer causal relationships from genetic association data using Mendelian randomization, colocalization, and mediation analysis.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/causal-genomics/colocalization-analysis` — Test whether two traits share a causal variant at a genomic locus using Bayesian colocalization with coloc. Computes posterior probabilities for shared vs distinct causal variants between GWAS and eQTL signals. Use when determining if a GWAS signal and an eQTL share the same causal variant.
- `research/bioinformatics/causal-genomics/fine-mapping` — Identify likely causal variants within GWAS loci using SuSiE for sum of single effects regression and FINEMAP for shotgun stochastic search. Computes posterior inclusion probabilities and credible sets to prioritize variants for functional follow-up. Use when narrowing GWAS association signals to candidate causal variants or building credible sets for functional validation.
- `research/bioinformatics/causal-genomics/mediation-analysis` — Decompose genetic effects into direct and indirect paths through mediating variables using the mediation R package. Tests whether gene expression, methylation, or other molecular phenotypes mediate the effect of genetic variants on disease. Use when testing whether a molecular phenotype mediates the genotype-to-phenotype relationship.
- `research/bioinformatics/causal-genomics/mendelian-randomization` — Estimate causal effects between exposures and outcomes using genetic variants as instrumental variables with TwoSampleMR. Implements IVW, MR-Egger, weighted median, and MR-PRESSO methods for robust causal inference from GWAS summary statistics. Use when testing whether an exposure causally affects an outcome using genetic instruments.
- `research/bioinformatics/causal-genomics/pleiotropy-detection` — Detect and correct for horizontal pleiotropy in Mendelian randomization analyses using MR-PRESSO for outlier removal, MR-Egger regression for directional pleiotropy, and Steiger filtering for variant directionality. Use when validating MR results, detecting pleiotropic instruments, or running sensitivity analyses for causal inference.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.