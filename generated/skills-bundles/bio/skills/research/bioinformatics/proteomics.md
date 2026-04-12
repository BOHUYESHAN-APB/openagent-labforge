---
name: "proteomics"
description: "Mass spectrometry-based proteomics analysis from raw data to differential abundance."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Proteomics Category Guide

Mass spectrometry-based proteomics analysis from raw data to differential abundance.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/proteomics/data-import` — Load and parse mass spectrometry data formats including mzML, mzXML, and quantification tool outputs like MaxQuant proteinGroups.txt. Use when starting a proteomics analysis with raw or processed MS data. Handles contaminant filtering and missing value assessment.
- `research/bioinformatics/proteomics/dia-analysis` — Data-independent acquisition (DIA) proteomics analysis with DIA-NN and other tools. Use when analyzing DIA mass spectrometry data with library-free or library-based workflows for deep proteome profiling.
- `research/bioinformatics/proteomics/differential-abundance` — Statistical testing for differentially abundant proteins between conditions. Covers preprocessing (log2 transformation, normalization), limma and DEqMS workflows with empirical Bayes moderation, fold change shrinkage for accurate effect size estimation, and Python alternatives. Use when identifying proteins with significant abundance changes between experimental groups.
- `research/bioinformatics/proteomics/peptide-identification` — Peptide-spectrum matching and protein identification from MS/MS data. Use when identifying peptides from tandem mass spectra. Covers database searching, spectral library matching, and FDR estimation using target-decoy approaches.
- `research/bioinformatics/proteomics/protein-inference` — Protein grouping and inference from peptide identifications. Use when resolving protein ambiguity from shared peptides. Handles protein groups and protein-level FDR control using parsimony and probabilistic approaches.
- `research/bioinformatics/proteomics/proteomics-qc` — Quality control and assessment for proteomics data. Use when evaluating proteomics data quality before downstream analysis. Covers sample metrics, missing value patterns, replicate correlation, batch effects, and intensity distributions.
- `research/bioinformatics/proteomics/ptm-analysis` — Post-translational modification analysis including phosphorylation, acetylation, and ubiquitination. Covers site localization, motif analysis, and quantitative PTM analysis. Use when analyzing phosphoproteomic data or other modification-enriched samples.
- `research/bioinformatics/proteomics/quantification` — Protein quantification from mass spectrometry data including label-free (LFQ, intensity-based), isobaric labeling (TMT, iTRAQ), and metabolic labeling (SILAC) approaches. Use when extracting protein abundances from MS data for differential analysis.
- `research/bioinformatics/proteomics/spectral-libraries` — Build, manage, and search spectral libraries for proteomics. Use when creating or working with spectral libraries for DIA analysis. Covers DDA-based library generation, predicted libraries (Prosit, DeepLC), and library formats.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.