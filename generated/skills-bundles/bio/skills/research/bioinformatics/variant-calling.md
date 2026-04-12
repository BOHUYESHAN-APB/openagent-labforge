---
name: "variant-calling"
description: "Variant calling and VCF/BCF file manipulation. Covers germline SNP/indel calling (bcftools, GATK HaplotypeCaller, DeepVariant), structural variant detection (Manta, Delly, GRIDSS), filtering (VQSR, hard filters, allele-specific), normalization, annotation (VEP, SnpEff, ANNOVAR), clinical interpretation (ACMG/ClinVar), and VCF utilities."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Variant Calling Category Guide

Variant calling and VCF/BCF file manipulation. Covers germline SNP/indel calling (bcftools, GATK HaplotypeCaller, DeepVariant), structural variant detection (Manta, Delly, GRIDSS), filtering (VQSR, hard filters, allele-specific), normalization, annotation (VEP, SnpEff, ANNOVAR), clinical interpretation (ACMG/ClinVar), and VCF utilities.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/variant-calling/clinical-interpretation` — Clinical variant interpretation using ClinVar, ACMG guidelines, and pathogenicity predictors. Prioritize variants for diagnostic and research applications. Use when interpreting clinical significance of variants.
- `research/bioinformatics/variant-calling/consensus-sequences` — Generate consensus FASTA sequences by applying VCF variants to a reference using bcftools consensus. Use when creating sample-specific reference sequences or reconstructing haplotypes.
- `research/bioinformatics/variant-calling/deepvariant` — Deep learning-based variant calling with Google DeepVariant. Provides high accuracy for germline SNPs and indels from Illumina, PacBio, and ONT data. Use when calling variants with DeepVariant deep learning caller or when highest germline calling accuracy is required.
- `research/bioinformatics/variant-calling/filtering-best-practices` — Comprehensive variant filtering including GATK VQSR, hard filters, bcftools expressions, and quality metric interpretation for SNPs and indels. Use when filtering variants using GATK best practices.
- `research/bioinformatics/variant-calling/gatk-variant-calling` — Variant calling with GATK HaplotypeCaller following best practices. Covers germline SNP/indel calling, GVCF workflow for cohorts, joint genotyping, and variant quality score recalibration (VQSR). Use when calling variants with GATK HaplotypeCaller.
- `research/bioinformatics/variant-calling/joint-calling` — Joint genotype calling across multiple samples using GATK CombineGVCFs and GenotypeGVCFs. Essential for cohort studies, population genetics, and leveraging VQSR. Use when performing joint genotyping across multiple samples.
- `research/bioinformatics/variant-calling/structural-variant-calling` — Call structural variants (SVs) from sequencing data using Manta, Delly, GRIDSS, and LUMPY. Detects deletions, insertions, inversions, duplications, and translocations too large for standard SNV callers. Use when detecting structural variants from short-read or long-read data and building consensus callsets.
- `research/bioinformatics/variant-calling/variant-annotation` — Comprehensive variant annotation using bcftools annotate/csq, VEP, SnpEff, and ANNOVAR. Add database annotations, predict functional consequences, and assess clinical significance with MANE transcript selection and pathogenicity scoring. Use when annotating variants with functional and clinical information.
- `research/bioinformatics/variant-calling/variant-calling` — Call SNPs and indels from aligned reads using bcftools mpileup and call. Use when detecting variants from BAM files or generating VCF from alignments.
- `research/bioinformatics/variant-calling/variant-normalization` — Normalize indel representation, decompose MNPs, and split multiallelic variants using bcftools norm. Use when comparing variants from different callers, preparing VCF for database annotation, or merging VCFs from multiple sources.
- `research/bioinformatics/variant-calling/vcf-basics` — View, query, and understand VCF/BCF variant files using bcftools and cyvcf2. Use when inspecting variants, extracting specific fields, or understanding VCF format structure.
- `research/bioinformatics/variant-calling/vcf-manipulation` — Merge, concatenate, sort, intersect, and subset VCF files using bcftools. Use when combining variant files, comparing call sets, or restructuring VCF data.
- `research/bioinformatics/variant-calling/vcf-statistics` — Generate variant statistics, sample concordance, and quality metrics using bcftools stats and gtcheck. Use when evaluating variant quality, comparing samples, or summarizing VCF contents.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.