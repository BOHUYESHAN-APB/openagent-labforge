---
name: "structural-biology"
description: "Protein structure analysis using Biopython's Bio.PDB module. Covers reading/writing PDB and mmCIF files, navigating the SMCRA hierarchy (Structure-Model-Chain-Residue-Atom), geometric calculations, superimposition, and working with AlphaFold predictions."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Structural Biology Category Guide

Protein structure analysis using Biopython's Bio.PDB module. Covers reading/writing PDB and mmCIF files, navigating the SMCRA hierarchy (Structure-Model-Chain-Residue-Atom), geometric calculations, superimposition, and working with AlphaFold predictions.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/structural-biology/alphafold-predictions` — Access and analyze AlphaFold protein structure predictions. Use when predicted structures are needed for proteins without experimental structures, or for confidence scores (pLDDT).
- `research/bioinformatics/structural-biology/geometric-analysis` — Perform geometric calculations on protein structures using Biopython Bio.PDB. Use when measuring distances, angles, and dihedrals, superimposing structures, calculating RMSD, or computing solvent accessible surface area (SASA).
- `research/bioinformatics/structural-biology/modern-structure-prediction` — Predict protein structures using modern ML models including AlphaFold3, ESMFold, Chai-1, and Boltz-1. Use when predicting structures for novel proteins, protein complexes, or when comparing predictions across multiple methods.
- `research/bioinformatics/structural-biology/structure-io` — Parse and write protein structure files using Biopython Bio.PDB. Use when reading PDB, mmCIF, and MMTF files, downloading structures from RCSB PDB, or writing structures to various formats.
- `research/bioinformatics/structural-biology/structure-modification` — Modify protein structures using Biopython Bio.PDB. Use when transforming coordinates, removing atoms or residues, adding new entities, modifying B-factors and occupancies, or building structures programmatically.
- `research/bioinformatics/structural-biology/structure-navigation` — Navigate protein structure hierarchy using Biopython Bio.PDB SMCRA model. Use when accessing models, chains, residues, and atoms, iterating over structure levels, or extracting sequences from PDB files.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.