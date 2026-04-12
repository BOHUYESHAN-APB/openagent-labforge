---
name: "workflow-management"
description: "Reproducible pipeline frameworks for scalable bioinformatics analyses with dependency management and cluster execution."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Workflow Management Category Guide

Reproducible pipeline frameworks for scalable bioinformatics analyses with dependency management and cluster execution.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/workflow-management/cwl-workflows` — Create portable, standards-based bioinformatics pipelines with Common Workflow Language (CWL). Use when building workflows that need maximum portability across execution platforms, sharing pipelines with collaborators using different systems, or contributing to community workflow registries.
- `research/bioinformatics/workflow-management/nextflow-pipelines` — Create scalable, containerized bioinformatics pipelines with Nextflow DSL2 supporting Docker, Singularity, and cloud execution. Use when building portable pipelines with container support, running workflows on cloud platforms (AWS, Google Cloud), or leveraging nf-core community pipelines.
- `research/bioinformatics/workflow-management/snakemake-workflows` — Build reproducible bioinformatics pipelines with Snakemake using rules, wildcards, and automatic dependency resolution. Use when creating Python-based workflows, automating multi-step analyses with make-like dependency tracking, or running pipelines on HPC clusters with SLURM.
- `research/bioinformatics/workflow-management/wdl-workflows` — Create portable bioinformatics pipelines with Workflow Description Language (WDL) using Cromwell or miniwdl execution engines. Use when running GATK best practices pipelines, working with Terra/AnVIL platforms, or building workflows for cloud execution on Google Cloud or AWS.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.