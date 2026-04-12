---
name: "immunoinformatics"
description: "Computational immunology including MHC binding prediction, neoantigen identification, epitope prediction, and TCR-antigen matching for vaccine design and cancer immunotherapy."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Immunoinformatics Category Guide

Computational immunology including MHC binding prediction, neoantigen identification, epitope prediction, and TCR-antigen matching for vaccine design and cancer immunotherapy.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/immunoinformatics/epitope-prediction` — Predict B-cell and T-cell epitopes using BepiPred, IEDB tools, and structure-based methods for vaccine and antibody design. Identify immunogenic regions in antigens. Use when designing vaccines, mapping antibody binding sites, or predicting immunogenic peptides.
- `research/bioinformatics/immunoinformatics/immunogenicity-scoring` — Score and prioritize neoantigens and epitopes for immunogenicity using multi-factor models combining MHC binding, processing, expression, and sequence features. Rank candidates for vaccine design. Use when prioritizing epitopes for vaccine development or identifying the most immunogenic neoantigens.
- `research/bioinformatics/immunoinformatics/mhc-binding-prediction` — Predict peptide-MHC class I and II binding affinity using MHCflurry and NetMHCpan neural network models. Identify potential T-cell epitopes from protein sequences. Use when predicting MHC binding for vaccine design or neoantigen identification.
- `research/bioinformatics/immunoinformatics/neoantigen-prediction` — Identify tumor neoantigens from somatic mutations using pVACtools for personalized cancer immunotherapy. Predict mutant peptides that bind patient HLA and may elicit T-cell responses. Use when identifying vaccine targets or checkpoint inhibitor response biomarkers from tumor sequencing data.
- `research/bioinformatics/immunoinformatics/tcr-epitope-binding` — Predict TCR-epitope specificity using ERGO-II and deep learning models for T-cell receptor antigen recognition. Match TCRs to their cognate epitopes or predict TCR targets. Use when analyzing TCR repertoire specificity or identifying antigen-reactive T-cells.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.