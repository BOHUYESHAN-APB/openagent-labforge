---
name: "bioinformatics"
description: "Root directory for the full bioinformatics skill catalog. Use this first to choose the correct bio category before loading detailed leaf skills."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "false"
  catalog_tier: "root"
  upstream_source: "OpenAgent Labforge"
---
# Bioinformatics Skills Directory

Use this root directory first when a bioinformatics request is broad, spans multiple assay types, or when you are not yet sure which specialized category should be loaded.

## Routing workflow

1. Match the task to one category guide below.
2. Invoke that category guide via the `skill` tool.
3. From the category guide, choose one or more detailed leaf skills.
4. Load leaf skills only after the category is clear.

## Category Guides

- `research/bioinformatics/alignment` — Pairwise and multiple sequence alignment: running MSA tools (MAFFT, MUSCLE5, ClustalOmega, T-Coffee), BioPython pairwise alignment, alignment I/O, and post-alignment analysis. Distinct from alignment-files which handles read-to-reference alignments (SAM/BAM). (5 leaf skills)
- `research/bioinformatics/alignment-files` — Working with SAM/BAM/CRAM alignment files using samtools and pysam. Covers the standard NGS workflow: viewing, sorting, indexing, filtering, marking duplicates, and preparing data for variant calling. (9 leaf skills)
- `research/bioinformatics/alternative-splicing` — Alternative splicing analysis for RNA-seq data covering event quantification, differential splicing detection, isoform switching analysis, and visualization. (6 leaf skills)
- `research/bioinformatics/atac-seq` — Analyze ATAC-seq data for chromatin accessibility profiling. Covers peak calling with MACS3, quality control metrics, differential accessibility analysis, and transcription factor footprinting. (6 leaf skills)
- `research/bioinformatics/causal-genomics` — Infer causal relationships from genetic association data using Mendelian randomization, colocalization, and mediation analysis. (5 leaf skills)
- `research/bioinformatics/chemoinformatics` — Computational chemistry for drug discovery covering molecular representations, property prediction, similarity searching, virtual screening, and ADMET analysis. (7 leaf skills)
- `research/bioinformatics/chip-seq` — ChIP-seq analysis using MACS3 and HOMER for peak calling, ChIPseeker for annotation, and DiffBind for differential binding. Used to study protein-DNA interactions including transcription factor binding and histone modifications. (7 leaf skills)
- `research/bioinformatics/clinical-biostatistics` — Statistical analysis methods for clinical trial data, from CDISC data handling through logistic regression, categorical testing, and regulatory-compliant reporting. (6 leaf skills)
- `research/bioinformatics/clinical-databases` — Query clinical and population genetics databases including ClinVar, dbSNP, gnomAD, and OMIM for variant interpretation and prioritization. (10 leaf skills)
- `research/bioinformatics/clip-seq` — Analyze CLIP-seq data (CLIP, PAR-CLIP, iCLIP, eCLIP) to identify protein-RNA binding sites at nucleotide resolution for understanding post-transcriptional regulation. (5 leaf skills)
- `research/bioinformatics/comparative-genomics` — Comparative genomics for analyzing genome evolution across species: synteny and collinearity, positive selection detection, ancestral sequence reconstruction, ortholog inference, and horizontal gene transfer detection. (5 leaf skills)
- `research/bioinformatics/copy-number` — Detect and analyze copy number variants (CNVs) from whole genome, exome, or targeted sequencing data. Covers read-depth based CNV detection with CNVkit and GATK, visualization, and functional annotation. (4 leaf skills)
- `research/bioinformatics/crispr-screens` — Analysis of pooled CRISPR knockout and activation screens for gene essentiality and functional genomics. (8 leaf skills)
- `research/bioinformatics/data-visualization` — Publication-quality data visualization for bioinformatics using ggplot2 and matplotlib with best practices for scientific figures. (12 leaf skills)
- `research/bioinformatics/database-access` — Access NCBI and UniProt databases, download sequences, query SRA/GEO, and run BLAST searches. Often the starting point of bioinformatics workflows for fetching data before local processing. (11 leaf skills)
- `research/bioinformatics/differential-expression` — Differential expression analysis using R/Bioconductor packages DESeq2 and edgeR for RNA-seq count data. Covers the complete workflow from count matrix to visualizations and significant gene lists, including decision guidance for method selection, result interpretation, and prokaryotic organisms. (6 leaf skills)
- `research/bioinformatics/ecological-genomics` — Analyze ecological and environmental genomics data. Covers eDNA metabarcoding, biodiversity metrics, community ecology, genotype-environment associations, conservation genetics, and molecular species delimitation. (6 leaf skills)
- `research/bioinformatics/epidemiological-genomics` — Pathogen surveillance and outbreak genomics including strain typing, time-scaled phylogenies, transmission inference, AMR tracking, and variant surveillance. (5 leaf skills)
- `research/bioinformatics/epitranscriptomics` — Analysis of RNA modifications (m6A, m5C) from MeRIP-seq and direct RNA sequencing. (5 leaf skills)
- `research/bioinformatics/experimental-design` — Skills for planning sequencing experiments, calculating power and sample sizes, and designing studies to minimize batch effects. (4 leaf skills)
- `research/bioinformatics/expression-matrix` — Load, normalize, manipulate, and annotate gene expression count matrices. Covers reading various formats (CSV, TSV, H5AD, RDS, 10X), normalization and transformation for different downstream tasks, sparse matrix handling for large datasets, gene ID mapping between databases, and joining sample metadata with experimental design guidance. (5 leaf skills)
- `research/bioinformatics/flow-cytometry` — Flow and mass cytometry analysis from FCS files to differential cell populations. (8 leaf skills)
- `research/bioinformatics/gene-regulatory-networks` — Infer and analyze gene regulatory networks from expression and chromatin data. Covers co-expression network analysis, transcription factor regulon discovery, multiomics GRN inference, perturbation simulation, and differential network comparison. (5 leaf skills)
- `research/bioinformatics/genome-annotation` — Annotate assembled genomes with gene predictions, functional assignments, repeat elements, non-coding RNAs, and annotation transfer between assemblies. (6 leaf skills)
- `research/bioinformatics/genome-assembly` — Assemble genomes and transcriptomes from sequencing reads using short-read, long-read, and hybrid approaches. Includes assembly quality assessment, polishing, scaffolding, and contamination detection. (8 leaf skills)
- `research/bioinformatics/genome-engineering` — Design CRISPR guides, predict off-targets, and create templates for genome editing experiments including Cas9/Cas12a knockouts, prime editing, base editing, and HDR knock-ins. (5 leaf skills)
- `research/bioinformatics/genome-intervals` — Genomic interval operations using BEDTools, pybedtools, and pyBigWig. Covers BED file manipulation, interval arithmetic, GTF/GFF parsing, coverage analysis, and bigWig track generation. (7 leaf skills)
- `research/bioinformatics/hi-c-analysis` — Analyze Hi-C and chromosome conformation capture data using cooler, cooltools, pairtools, and HiCExplorer. (8 leaf skills)
- `research/bioinformatics/imaging-mass-cytometry` — Spatial proteomics analysis from imaging mass cytometry (IMC) and multiplexed ion beam imaging (MIBI) data. (6 leaf skills)
- `research/bioinformatics/immunoinformatics` — Computational immunology including MHC binding prediction, neoantigen identification, epitope prediction, and TCR-antigen matching for vaccine design and cancer immunotherapy. (5 leaf skills)
- `research/bioinformatics/liquid-biopsy` — Cell-free DNA and circulating tumor DNA analysis for non-invasive cancer detection, tumor fraction estimation, mutation detection, and treatment monitoring from plasma samples. (6 leaf skills)
- `research/bioinformatics/long-read-sequencing` — Analysis of long-read sequencing data from Oxford Nanopore and PacBio. Covers alignment with minimap2, polishing, variant calling with medaka and Clair3, and structural variant detection with Sniffles. (8 leaf skills)
- `research/bioinformatics/machine-learning` — Machine learning skills for biomarker discovery, model interpretation, and predictive modeling on omics data. (6 leaf skills)
- `research/bioinformatics/metabolomics` — LC-MS and GC-MS metabolomics analysis from raw data to metabolite identification and pathway interpretation. (8 leaf skills)
- `research/bioinformatics/metagenomics` — Taxonomic profiling of metagenomic data using Kraken2 for k-mer based classification and MetaPhlAn for marker gene profiling. Includes abundance estimation with Bracken and functional profiling with HUMAnN. (7 leaf skills)
- `research/bioinformatics/methylation-analysis` — DNA methylation analysis using Bismark for bisulfite sequencing alignment, methylKit/bsseq for downstream analysis, and scipy/limma for per-CpG differential testing. Covers alignment, methylation calling, per-CpG statistical testing, and detection of differentially methylated regions (DMRs). (5 leaf skills)
- `research/bioinformatics/microbiome` — 16S/ITS amplicon sequencing analysis from raw reads to differential abundance testing. (6 leaf skills)
- `research/bioinformatics/multi-omics-integration` — Statistical integration of multiple omics data types (transcriptomics, proteomics, metabolomics, etc.) for biological discovery. (4 leaf skills)
- `research/bioinformatics/pathway-analysis` — Functional enrichment and pathway analysis using R/Bioconductor. Supports over-representation analysis (ORA) and Gene Set Enrichment Analysis (GSEA) across Gene Ontology, KEGG, Reactome, and WikiPathways databases. Includes guidance for prokaryotic organisms, multi-condition comparison, and common methodological pitfalls. (6 leaf skills)
- `research/bioinformatics/phasing-imputation` — Phase haplotypes and impute missing genotypes using reference panels. Essential for GWAS, population genetics, and integrating array and sequencing data. Covers Beagle, SHAPEIT, and reference panel management. (4 leaf skills)
- `research/bioinformatics/phylogenetics` — Phylogenetic tree analysis covering I/O, manipulation, visualization, distance-based methods, maximum likelihood inference, Bayesian analysis, divergence time estimation, and coalescent species tree methods. Provides expert-level decision guidance for model selection, support interpretation, and method choice. (8 leaf skills)
- `research/bioinformatics/population-genetics` — Population genetic analysis using PLINK, Admixture, and scikit-allel. Covers GWAS, population structure analysis, selection statistics, and linkage disequilibrium calculations. (6 leaf skills)
- `research/bioinformatics/primer-design` — Design and validate PCR primers using primer3-py, the Python binding for Primer3. (3 leaf skills)
- `research/bioinformatics/proteomics` — Mass spectrometry-based proteomics analysis from raw data to differential abundance. (9 leaf skills)
- `research/bioinformatics/read-alignment` — Align short reads to reference genomes using standard aligners. Covers DNA alignment with bwa-mem2/bowtie2 and RNA-seq spliced alignment with STAR/HISAT2. (4 leaf skills)
- `research/bioinformatics/read-qc` — Read quality control and preprocessing - the first step in any NGS workflow. Covers quality assessment with FastQC/MultiQC, adapter trimming, quality filtering, and contamination screening. (7 leaf skills)
- `research/bioinformatics/reporting` — Reproducible report generation for bioinformatics analyses using literate programming frameworks and QC aggregation. (5 leaf skills)
- `research/bioinformatics/restriction-analysis` — Restriction enzyme analysis using Biopython Bio.Restriction. Find cut sites, create restriction maps, select enzymes for cloning, and predict fragment sizes. Includes data for 800+ enzymes from REBASE. (4 leaf skills)
- `research/bioinformatics/ribo-seq` — Analyze ribosome profiling (Ribo-seq) data to study translation at single-codon resolution, including periodicity QC, ORF detection, and translation efficiency calculation. (5 leaf skills)
- `research/bioinformatics/rna-quantification` — Quantify gene and transcript expression from RNA-seq data. Covers BAM-based counting with featureCounts and alignment-free quantification with Salmon/kallisto, plus import to R for differential expression. (4 leaf skills)
- `research/bioinformatics/rna-structure` — Predict and analyze RNA secondary structures, search for non-coding RNA families, and interpret experimental structure probing data. (3 leaf skills)
- `research/bioinformatics/sequence-io` — Sequence file input/output operations using Biopython's Bio.SeqIO module. Handles reading, writing, and converting biological sequence files in 40+ formats including FASTA, FASTQ, GenBank, and specialized formats like ABI traces. (9 leaf skills)
- `research/bioinformatics/sequence-manipulation` — Working with sequence data programmatically using Biopython's Bio.Seq and Bio.SeqUtils modules. Handles transcription, translation, reverse complement, motif finding, and sequence property calculations. (7 leaf skills)
- `research/bioinformatics/single-cell` — Single-cell RNA-seq analysis using Seurat (R) and Scanpy (Python). Covers the complete workflow from loading data through quality control, normalization, clustering, marker gene identification, and cell type annotation. (14 leaf skills)
- `research/bioinformatics/small-rna-seq` — Analyze small RNA sequencing data including miRNA, piRNA, and snoRNA for discovery, quantification, and differential expression analysis. (5 leaf skills)
- `research/bioinformatics/spatial-transcriptomics` — Analyze spatial transcriptomics data from Visium, Xenium, MERFISH, and other platforms using Squidpy and SpatialData. (11 leaf skills)
- `research/bioinformatics/structural-biology` — Protein structure analysis using Biopython's Bio.PDB module. Covers reading/writing PDB and mmCIF files, navigating the SMCRA hierarchy (Structure-Model-Chain-Residue-Atom), geometric calculations, superimposition, and working with AlphaFold predictions. (6 leaf skills)
- `research/bioinformatics/systems-biology` — Constraint-based metabolic modeling including flux balance analysis, genome-scale model reconstruction, curation, and context-specific model building. (5 leaf skills)
- `research/bioinformatics/tcr-bcr-analysis` — Analyze T-cell receptor (TCR) and B-cell receptor (BCR) repertoires from bulk or single-cell sequencing data for immunology research, vaccine development, and cancer immunotherapy. (5 leaf skills)
- `research/bioinformatics/temporal-genomics` — Analyze temporal patterns in omics time-series data. Covers circadian rhythm detection, temporal gene clustering, trajectory modeling with GAMs, dynamic gene regulatory network inference, and periodicity discovery. (5 leaf skills)
- `research/bioinformatics/utilities` — Utility and installer-adjacent skills from GPTomics/bioSkills. (1 leaf skills)
- `research/bioinformatics/variant-calling` — Variant calling and VCF/BCF file manipulation. Covers germline SNP/indel calling (bcftools, GATK HaplotypeCaller, DeepVariant), structural variant detection (Manta, Delly, GRIDSS), filtering (VQSR, hard filters, allele-specific), normalization, annotation (VEP, SnpEff, ANNOVAR), clinical interpretation (ACMG/ClinVar), and VCF utilities. (13 leaf skills)
- `research/bioinformatics/workflow-management` — Reproducible pipeline frameworks for scalable bioinformatics analyses with dependency management and cluster execution. (4 leaf skills)
- `research/bioinformatics/workflows` — End-to-end bioinformatics pipelines that orchestrate multiple skills into complete analysis workflows. Each workflow provides a primary recommended path plus alternatives, with QC checkpoints between major steps. (41 leaf skills)
- `research/bioinformatics/labforge-core` — OpenAgent Labforge's existing opinionated bio skills, exposed here as wrappers so they participate in the same category-first routing flow. (30 leaf skills)

## Notes

- `labforge-core` contains the plugin's existing opinionated bio skills as category-routed wrappers.
- All detailed leaf skills are intentionally hidden from the global discovery list to keep prompt weight low.
- Once you know the right leaf skill name, call it directly with the `skill` tool.