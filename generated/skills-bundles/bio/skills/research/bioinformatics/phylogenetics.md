---
name: "phylogenetics"
description: "Phylogenetic tree analysis covering I/O, manipulation, visualization, distance-based methods, maximum likelihood inference, Bayesian analysis, divergence time estimation, and coalescent species tree methods. Provides expert-level decision guidance for model selection, support interpretation, and method choice."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Phylogenetics Category Guide

Phylogenetic tree analysis covering I/O, manipulation, visualization, distance-based methods, maximum likelihood inference, Bayesian analysis, divergence time estimation, and coalescent species tree methods. Provides expert-level decision guidance for model selection, support interpretation, and method choice.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/phylogenetics/bayesian-inference` — Run Bayesian phylogenetic analysis with MrBayes, BEAST2, RevBayes, and PhyloBayes including MCMC convergence diagnostics and model comparison. Use when needing posterior probability support, Bayesian model averaging, site-heterogeneous models for deep phylogenies, or formal model comparison via stepping-stone sampling.
- `research/bioinformatics/phylogenetics/distance-calculations` — Compute evolutionary distances and build phylogenetic trees using Biopython Bio.Phylo.TreeConstruction. Use when creating distance matrices from alignments, building NJ/UPGMA trees, generating bootstrap consensus, or needing quick exploratory phylogenies before running full ML analysis.
- `research/bioinformatics/phylogenetics/divergence-dating` — Estimate divergence times using molecular clock models with BEAST2, MCMCTree, and TreePL. Use when dating speciation events, calibrating phylogenies with fossils, choosing between strict and relaxed clock models, or estimating evolutionary rates across lineages.
- `research/bioinformatics/phylogenetics/modern-tree-inference` — Build maximum likelihood phylogenetic trees using IQ-TREE2 and RAxML-NG with expert model selection, branch support assessment, and topology testing. Use when inferring publication-quality ML trees, selecting substitution models, interpreting bootstrap and concordance factor support, or running partitioned phylogenomic analyses.
- `research/bioinformatics/phylogenetics/species-trees` — Estimate species trees using coalescent methods including ASTRAL-III, wASTRAL, ASTRAL-Pro, SVDQuartets, and BPP. Use when multi-locus data shows gene tree discordance from incomplete lineage sorting, when in the anomaly zone where concatenation is misleading, or when computing concordance factors to assess topological support.
- `research/bioinformatics/phylogenetics/tree-io` — Read, write, and convert phylogenetic tree files using Biopython Bio.Phylo. Use when parsing Newick, Nexus, PhyloXML, or NeXML tree formats, converting between formats, or handling multiple trees.
- `research/bioinformatics/phylogenetics/tree-manipulation` — Modify phylogenetic tree structure using Biopython Bio.Phylo. Use when rooting trees with outgroups, midpoint, or MAD methods, pruning taxa, collapsing clades, ladderizing branches, or extracting subtrees. Includes rooting method decision guidance.
- `research/bioinformatics/phylogenetics/tree-visualization` — Draw and export phylogenetic trees using Biopython Bio.Phylo with matplotlib and modern alternatives. Use when creating tree figures, customizing colors and labels, exporting to image formats, or choosing between Bio.Phylo, ggtree, ETE4, and iTOL for publication.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.