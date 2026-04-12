---
name: "chemoinformatics"
description: "Computational chemistry for drug discovery covering molecular representations, property prediction, similarity searching, virtual screening, and ADMET analysis."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Chemoinformatics Category Guide

Computational chemistry for drug discovery covering molecular representations, property prediction, similarity searching, virtual screening, and ADMET analysis.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/chemoinformatics/admet-prediction` — Predicts ADMET properties using ADMETlab 3.0 API or DeepChem models. Estimates bioavailability, CYP inhibition, hERG liability, and 119 toxicity endpoints with uncertainty quantification. Filters for PAINS and other structural alerts. Use when filtering compounds for drug-likeness or prioritizing leads by predicted safety.
- `research/bioinformatics/chemoinformatics/molecular-descriptors` — Calculates molecular descriptors and fingerprints using RDKit. Computes Morgan fingerprints (ECFP), MACCS keys, Lipinski properties, QED drug-likeness, TPSA, and 3D conformer descriptors. Use when featurizing molecules for machine learning or filtering by drug-likeness criteria.
- `research/bioinformatics/chemoinformatics/molecular-io` — Reads, writes, and converts molecular file formats (SMILES, SDF, MOL2, PDB) using RDKit and Open Babel. Handles structure parsing, canonicalization, and full standardization pipeline including sanitization, normalization, and tautomer canonicalization. Use when loading chemical libraries, converting formats, or preparing molecules for analysis.
- `research/bioinformatics/chemoinformatics/reaction-enumeration` — Enumerates chemical libraries through reaction SMARTS transformations using RDKit. Generates virtual compound libraries from building blocks using defined chemical reactions with product validation. Use when creating combinatorial libraries or enumerating products from synthetic routes.
- `research/bioinformatics/chemoinformatics/similarity-searching` — Performs molecular similarity searches using Tanimoto coefficient on fingerprints via RDKit. Finds structurally similar compounds using ECFP or MACCS keys and clusters molecules by structural similarity using Butina clustering. Use when finding analogs of a query compound or clustering chemical libraries.
- `research/bioinformatics/chemoinformatics/substructure-search` — Searches molecular libraries for substructure matches using SMARTS patterns with RDKit. Filters compounds by pharmacophore features, functional groups, or scaffold matches with atom mapping. Use when finding compounds containing specific chemical moieties or filtering libraries by structural features.
- `research/bioinformatics/chemoinformatics/virtual-screening` — Performs structure-based virtual screening using AutoDock Vina 1.2 for molecular docking. Prepares receptor PDBQT files, generates ligand conformers, defines binding site boxes, and ranks compounds by predicted binding affinity. Use when screening chemical libraries against a protein structure to find potential binders.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.