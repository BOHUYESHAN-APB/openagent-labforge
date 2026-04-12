---
name: "labforge-core"
description: "OpenAgent Labforge's existing opinionated bio skills, exposed here as wrappers so they participate in the same category-first routing flow."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "OpenAgent Labforge"
---
# Labforge Core Category Guide

OpenAgent Labforge's existing opinionated bio skills, exposed here as wrappers so they participate in the same category-first routing flow.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/labforge-core/atac-seq` — ATAC-seq execution guidance.
- `research/bioinformatics/labforge-core/bio-methods` — Method design, study framing, and statistical planning for bio workflows.
- `research/bioinformatics/labforge-core/bio-pipeline` — Execution-stage pipeline guidance for multi-step bioinformatics tasks.
- `research/bioinformatics/labforge-core/bio-tools` — Opinionated Labforge bio toolchain and environment guidance.
- `research/bioinformatics/labforge-core/bio-visualization` — Publication-ready bio figure and plot guidance.
- `research/bioinformatics/labforge-core/blast-search` — Homology and BLAST-driven sequence search guidance.
- `research/bioinformatics/labforge-core/cell-annotation` — Cell type annotation and marker review guidance.
- `research/bioinformatics/labforge-core/chip-seq` — ChIP-seq execution guidance.
- `research/bioinformatics/labforge-core/differential-expression` — Differential expression analysis guidance.
- `research/bioinformatics/labforge-core/experimental-design` — Experimental design and power analysis guidance.
- `research/bioinformatics/labforge-core/functional-annotation` — Functional annotation, domain, and pathway interpretation guidance.
- `research/bioinformatics/labforge-core/genome-annotation` — Genome annotation workflow guidance.
- `research/bioinformatics/labforge-core/genome-intervals` — Genome interval and annotation-file operations guidance.
- `research/bioinformatics/labforge-core/geo-query` — GEO dataset retrieval and reuse guidance.
- `research/bioinformatics/labforge-core/metagenomics` — Metagenomics execution guidance.
- `research/bioinformatics/labforge-core/paper-evidence` — Paper evidence extraction and synthesis for scientific tasks.
- `research/bioinformatics/labforge-core/pathway-analysis` — Pathway enrichment and GSEA guidance.
- `research/bioinformatics/labforge-core/proteomics` — Proteomics execution guidance.
- `research/bioinformatics/labforge-core/pubmed-search` — PubMed literature search guidance.
- `research/bioinformatics/labforge-core/read-alignment` — Read alignment and mapping guidance.
- `research/bioinformatics/labforge-core/read-qc` — FASTQ quality control and preprocessing guidance.
- `research/bioinformatics/labforge-core/reporting` — Reproducible scientific reporting guidance.
- `research/bioinformatics/labforge-core/rna-quantification` — RNA quantification guidance.
- `research/bioinformatics/labforge-core/scrna-preprocessing` — Single-cell preprocessing, QC, and clustering guidance.
- `research/bioinformatics/labforge-core/sequence-analysis` — Sequence parsing and analysis guidance.
- `research/bioinformatics/labforge-core/structural-biology` — Protein and structure analysis guidance.
- `research/bioinformatics/labforge-core/variant-calling` — Variant calling workflow guidance.
- `research/bioinformatics/labforge-core/vector-design` — Vector and construct design guidance.
- `research/bioinformatics/labforge-core/wet-lab-design` — Wet-lab validation design and follow-up experiment planning.
- `research/bioinformatics/labforge-core/workflow-management` — Reusable workflow and pipeline framework guidance.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.