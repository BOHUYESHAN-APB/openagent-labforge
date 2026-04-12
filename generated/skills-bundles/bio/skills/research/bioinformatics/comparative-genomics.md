---
name: "comparative-genomics"
description: "Comparative genomics for analyzing genome evolution across species: synteny and collinearity, positive selection detection, ancestral sequence reconstruction, ortholog inference, and horizontal gene transfer detection."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Comparative Genomics Category Guide

Comparative genomics for analyzing genome evolution across species: synteny and collinearity, positive selection detection, ancestral sequence reconstruction, ortholog inference, and horizontal gene transfer detection.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/comparative-genomics/ancestral-reconstruction` — Reconstruct ancestral sequences at phylogenetic nodes using PAML and IQ-TREE marginal likelihood methods. Infer ancient protein sequences and trace evolutionary trajectories through sequence history. Use when inferring ancestral states for protein resurrection or tracing evolutionary history.
- `research/bioinformatics/comparative-genomics/hgt-detection` — Detect horizontal gene transfer events using HGTector, compositional analysis, and phylogenetic incongruence methods. Identify foreign genes in bacterial and archaeal genomes from anomalous composition or unexpected phylogenetic placement. Use when searching for horizontally transferred genes or analyzing genome evolution in prokaryotes.
- `research/bioinformatics/comparative-genomics/ortholog-inference` — Infer orthologous gene groups across species using OrthoFinder and ProteinOrtho. Identify orthologs, paralogs, and co-orthologs for comparative genomics and functional annotation transfer. Use when identifying gene orthologs across species or building orthogroups for evolutionary analysis.
- `research/bioinformatics/comparative-genomics/positive-selection` — Detect positive selection using dN/dS (omega) tests with PAML codeml and HyPhy. Identify sites and branches under adaptive evolution through codon models and branch-site tests. Use when testing for adaptive evolution in gene families or identifying positively selected sites.
- `research/bioinformatics/comparative-genomics/synteny-analysis` — Analyze genome collinearity and syntenic blocks using MCScanX, SyRI, and JCVI for comparative genomics. Detect conserved gene order, chromosomal rearrangements, and whole-genome duplications. Use when comparing genome structure between species or identifying conserved genomic regions.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.