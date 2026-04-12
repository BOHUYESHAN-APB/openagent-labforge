---
name: "epidemiological-genomics"
description: "Pathogen surveillance and outbreak genomics including strain typing, time-scaled phylogenies, transmission inference, AMR tracking, and variant surveillance."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Epidemiological Genomics Category Guide

Pathogen surveillance and outbreak genomics including strain typing, time-scaled phylogenies, transmission inference, AMR tracking, and variant surveillance.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/epidemiological-genomics/amr-surveillance` — Detect and track antimicrobial resistance genes using AMRFinderPlus and ResFinder with epidemiological context. Monitor resistance trends and identify emerging resistance patterns. Use when screening genomes for AMR genes or tracking resistance in surveillance programs.
- `research/bioinformatics/epidemiological-genomics/pathogen-typing` — Perform multi-locus sequence typing (MLST), core genome MLST, and SNP-based strain typing for bacterial isolate characterization using mlst and chewBBACA. Use when identifying strain types, tracking outbreak clones, or characterizing bacterial isolates.
- `research/bioinformatics/epidemiological-genomics/phylodynamics` — Construct time-scaled phylogenies and infer evolutionary dynamics using TreeTime and BEAST2 for outbreak analysis. Estimate divergence times, molecular clock rates, and ancestral states. Use when dating outbreak origins, estimating transmission rates, or building time-calibrated trees.
- `research/bioinformatics/epidemiological-genomics/transmission-inference` — Infer pathogen transmission networks and identify likely transmission pairs using TransPhylo and outbreak reconstruction algorithms. Estimate who-infected-whom from genomic and epidemiological data. Use when investigating outbreak transmission chains or identifying superspreaders.
- `research/bioinformatics/epidemiological-genomics/variant-surveillance` — Assign pathogen lineages and track variants using Nextclade and pangolin for viral surveillance. Monitor variant prevalence and identify emerging variants of concern. Use when classifying viral sequences, tracking lineage dynamics, or monitoring for variants of concern.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.