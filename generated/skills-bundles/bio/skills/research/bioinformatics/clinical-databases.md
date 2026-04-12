---
name: "clinical-databases"
description: "Query clinical and population genetics databases including ClinVar, dbSNP, gnomAD, and OMIM for variant interpretation and prioritization."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Clinical Databases Category Guide

Query clinical and population genetics databases including ClinVar, dbSNP, gnomAD, and OMIM for variant interpretation and prioritization.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/clinical-databases/clinvar-lookup` — Query ClinVar for variant pathogenicity classifications, review status, and disease associations via REST API or local VCF. Use when determining clinical significance of variants for diagnostic or research purposes.
- `research/bioinformatics/clinical-databases/dbsnp-queries` — Query dbSNP for rsID lookups, variant annotations, and cross-references to other databases. Use when mapping between rsIDs and genomic coordinates or retrieving basic variant information.
- `research/bioinformatics/clinical-databases/gnomad-frequencies` — Query gnomAD for population allele frequencies to assess variant rarity. Use when filtering variants by population frequency for rare disease analysis or determining if a variant is common in the general population.
- `research/bioinformatics/clinical-databases/hla-typing` — Call HLA alleles from NGS data using OptiType, HLA-HD, or arcasHLA for immunogenomics applications. Use when determining HLA genotype for transplant matching, neoantigen prediction, or pharmacogenomic screening.
- `research/bioinformatics/clinical-databases/myvariant-queries` — Query myvariant.info API for aggregated variant annotations from multiple databases (ClinVar, gnomAD, dbSNP, COSMIC, etc.) in a single request. Use when annotating variants with clinical and population data from multiple sources simultaneously.
- `research/bioinformatics/clinical-databases/pharmacogenomics` — Query PharmGKB and CPIC for drug-gene interactions, pharmacogenomic annotations, and dosing guidelines. Use when predicting drug response from genetic variants or implementing clinical pharmacogenomics.
- `research/bioinformatics/clinical-databases/polygenic-risk` — Calculate polygenic risk scores using PRSice-2, LDpred2, or PRS-CS from GWAS summary statistics. Use when predicting disease risk from genome-wide genetic variants.
- `research/bioinformatics/clinical-databases/somatic-signatures` — Extract and analyze mutational signatures from somatic variants using SigProfiler or MutationalPatterns to characterize mutagenic processes. Use when identifying DNA damage mechanisms or etiology in cancer genomes.
- `research/bioinformatics/clinical-databases/tumor-mutational-burden` — Calculate tumor mutational burden from panel or WES data with proper normalization and clinical thresholds. Use when assessing immunotherapy eligibility or characterizing tumor immunogenicity.
- `research/bioinformatics/clinical-databases/variant-prioritization` — Filter and prioritize variants by pathogenicity, population frequency, and clinical evidence for rare disease analysis. Use when identifying candidate disease-causing variants from exome or genome sequencing.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.