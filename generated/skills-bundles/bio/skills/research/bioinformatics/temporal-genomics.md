---
name: "temporal-genomics"
description: "Analyze temporal patterns in omics time-series data. Covers circadian rhythm detection, temporal gene clustering, trajectory modeling with GAMs, dynamic gene regulatory network inference, and periodicity discovery."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Temporal Genomics Category Guide

Analyze temporal patterns in omics time-series data. Covers circadian rhythm detection, temporal gene clustering, trajectory modeling with GAMs, dynamic gene regulatory network inference, and periodicity discovery.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/temporal-genomics/circadian-rhythms` — Detects circadian and ultradian rhythms in time-series omics data using CosinorPy cosinor models, MetaCycle (JTK_CYCLE, ARSER), and RAIN non-parametric tests. Fits cosine models to estimate phase and amplitude, tests rhythmicity significance at pre-specified periods. Use when testing for 24-hour or other known-period oscillations in circadian, feeding-fasting, or light-dark cycle experiments. Not for unknown-period discovery (see temporal-genomics/periodicity-detection).
- `research/bioinformatics/temporal-genomics/periodicity-detection` — Discovers periodic signals of unknown period in time-series omics data using Lomb-Scargle periodograms (scipy), autocorrelation, and wavelet time-frequency decomposition (pywt). Identifies dominant frequencies, handles irregularly sampled data, and detects transient periodicity. Use when searching for periodic patterns of unknown period length, analyzing cell cycle oscillations, or processing unevenly spaced time-series. Not for testing known 24-hour rhythms (see temporal-genomics/circadian-rhythms).
- `research/bioinformatics/temporal-genomics/temporal-clustering` — Clusters genes by temporal expression profile shape using Mfuzz soft clustering, TCseq, and DEGreport degPatterns. Groups co-regulated genes into shared trajectory patterns via fuzzy c-means or hierarchical approaches. Use when categorizing temporally dynamic genes into response groups or identifying co-expression modules across time points. Requires temporally variable genes identified first (see differential-expression/timeseries-de).
- `research/bioinformatics/temporal-genomics/temporal-grn` — Infers dynamic gene regulatory networks from bulk time-series expression data using Granger causality (statsmodels), dynGENIE3 (Extra-Trees on ODE-derived expression derivatives), and dynamic Bayesian networks (bnlearn). Identifies time-delayed regulatory relationships and tracks network rewiring across conditions. Use when inferring causal regulatory relationships from bulk temporal expression data or detecting TF influence propagation over time. Not for static co-expression networks (see gene-regulatory-networks/coexpression-networks).
- `research/bioinformatics/temporal-genomics/trajectory-modeling` — Models continuous temporal trajectories from bulk or time-resolved omics data using generalized additive models (mgcv), spline regression, and changepoint detection (segmented, ruptures). Fits smooth gene expression curves and tests trajectory differences between conditions. Use when fitting non-linear temporal models to bulk time-series data or comparing developmental trajectories across conditions. Not for single-cell pseudotime (see single-cell/trajectory-inference).

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.