---
name: "systems-biology"
description: "Constraint-based metabolic modeling including flux balance analysis, genome-scale model reconstruction, curation, and context-specific model building."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Systems Biology Category Guide

Constraint-based metabolic modeling including flux balance analysis, genome-scale model reconstruction, curation, and context-specific model building.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/systems-biology/context-specific-models` — Build tissue and condition-specific metabolic models using GIMME, iMAT, and INIT algorithms with expression data constraints. Create models that reflect cell-type specific metabolism. Use when building tissue-specific metabolic models or integrating transcriptomics with FBA.
- `research/bioinformatics/systems-biology/flux-balance-analysis` — Perform flux balance analysis (FBA) and flux variability analysis (FVA) on genome-scale metabolic models using COBRApy. Predict growth rates, metabolic fluxes, and optimal resource utilization. Use when predicting metabolic phenotypes or optimizing flux distributions.
- `research/bioinformatics/systems-biology/gene-essentiality` — Perform in silico gene knockout analysis and synthetic lethality screens using COBRApy single and double deletions. Predict essential genes and identify synthetic lethal pairs for drug target discovery. Use when identifying essential genes or finding synthetic lethal drug targets.
- `research/bioinformatics/systems-biology/metabolic-reconstruction` — Build genome-scale metabolic models from genome sequences using CarveMe and gapseq for automated reconstruction. Generate draft models ready for curation and analysis. Use when creating metabolic models for organisms without existing models.
- `research/bioinformatics/systems-biology/model-curation` — Validate, gap-fill, and curate genome-scale metabolic models using memote for quality scores and COBRApy for manual curation. Ensure models meet SBML standards and produce biologically meaningful predictions. Use when improving draft models or preparing models for publication.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.