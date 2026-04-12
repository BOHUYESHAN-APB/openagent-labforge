---
name: "primer-design"
description: "Design and validate PCR primers using primer3-py, the Python binding for Primer3."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Primer Design Category Guide

Design and validate PCR primers using primer3-py, the Python binding for Primer3.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/primer-design/primer-basics` — Design PCR primers for a target sequence using primer3-py. Specify target regions, product size, melting temperature, and other constraints. Returns ranked primer pairs with quality metrics. Use when designing standard PCR primers.
- `research/bioinformatics/primer-design/primer-validation` — Validate PCR primers for specificity, dimers, hairpins, and secondary structures using primer3-py thermodynamic calculations. Check self-complementarity, heterodimer formation, and 3' stability. Use when validating primer specificity and properties.
- `research/bioinformatics/primer-design/qpcr-primers` — Design qPCR primers and TaqMan/molecular beacon probes using primer3-py. Configure probe Tm, primer-probe spacing, and hydrolysis probe constraints for real-time PCR assays. Use when designing qPCR primers and probes.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.