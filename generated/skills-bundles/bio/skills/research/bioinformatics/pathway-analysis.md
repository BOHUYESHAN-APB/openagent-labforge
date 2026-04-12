---
name: "pathway-analysis"
description: "Functional enrichment and pathway analysis using R/Bioconductor. Supports over-representation analysis (ORA) and Gene Set Enrichment Analysis (GSEA) across Gene Ontology, KEGG, Reactome, and WikiPathways databases. Includes guidance for prokaryotic organisms, multi-condition comparison, and common methodological pitfalls."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Pathway Analysis Category Guide

Functional enrichment and pathway analysis using R/Bioconductor. Supports over-representation analysis (ORA) and Gene Set Enrichment Analysis (GSEA) across Gene Ontology, KEGG, Reactome, and WikiPathways databases. Includes guidance for prokaryotic organisms, multi-condition comparison, and common methodological pitfalls.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/pathway-analysis/enrichment-visualization` — Visualize enrichment results using enrichplot package functions. Use when creating publication-quality figures from clusterProfiler results. Covers dotplot, barplot, cnetplot, emapplot, gseaplot2, ridgeplot, and treeplot.
- `research/bioinformatics/pathway-analysis/go-enrichment` — Gene Ontology over-representation analysis using clusterProfiler enrichGO. Use when identifying biological functions enriched in a gene list from differential expression or other analyses. Supports all three ontologies (BP, MF, CC), multiple ID types, and customizable statistical thresholds.
- `research/bioinformatics/pathway-analysis/gsea` — Gene Set Enrichment Analysis using clusterProfiler gseGO and gseKEGG. Use when analyzing ranked gene lists to find coordinated expression changes in gene sets without arbitrary significance cutoffs. Detects subtle but coordinated expression changes.
- `research/bioinformatics/pathway-analysis/kegg-pathways` — KEGG pathway and module enrichment analysis using clusterProfiler enrichKEGG and enrichMKEGG. Use when identifying metabolic and signaling pathways over-represented in a gene list. Supports 4000+ organisms via KEGG online database.
- `research/bioinformatics/pathway-analysis/reactome-pathways` — Reactome pathway enrichment using ReactomePA package. Use when analyzing gene lists against Reactome's curated peer-reviewed pathway database. Performs over-representation analysis and GSEA with visualization and pathway hierarchy exploration.
- `research/bioinformatics/pathway-analysis/wikipathways` — WikiPathways enrichment using clusterProfiler and rWikiPathways. Use when analyzing gene lists against community-curated open-source pathways. Performs over-representation analysis and GSEA for 30+ species.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.