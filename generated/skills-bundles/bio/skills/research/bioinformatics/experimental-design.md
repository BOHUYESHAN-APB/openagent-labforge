---
name: "experimental-design"
description: "Skills for planning sequencing experiments, calculating power and sample sizes, and designing studies to minimize batch effects."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Experimental Design Category Guide

Skills for planning sequencing experiments, calculating power and sample sizes, and designing studies to minimize batch effects.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/experimental-design/batch-design` — Designs experiments to minimize and account for batch effects using balanced layouts and blocking strategies. Use when planning multi-batch experiments, assigning samples to sequencing lanes, or designing studies where technical variation could confound biological signals.
- `research/bioinformatics/experimental-design/multiple-testing` — Applies multiple testing correction methods including FDR, Bonferroni, and q-value for genomics data. Use when filtering differential expression results, setting significance thresholds, or choosing between correction methods for different study designs.
- `research/bioinformatics/experimental-design/power-analysis` — Calculates statistical power and minimum sample sizes for RNA-seq, ATAC-seq, and other sequencing experiments. Use when planning experiments, determining how many replicates are needed, or assessing whether a study is adequately powered to detect expected effect sizes.
- `research/bioinformatics/experimental-design/sample-size` — Estimates required sample sizes for differential expression, ChIP-seq, methylation, and proteomics studies. Use when budgeting experiments, writing grant proposals, or determining minimum replicates needed to achieve statistical significance for expected effect sizes.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.