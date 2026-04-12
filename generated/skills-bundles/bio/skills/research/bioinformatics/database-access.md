---
name: "database-access"
description: "Access NCBI and UniProt databases, download sequences, query SRA/GEO, and run BLAST searches. Often the starting point of bioinformatics workflows for fetching data before local processing."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Database Access Category Guide

Access NCBI and UniProt databases, download sequences, query SRA/GEO, and run BLAST searches. Often the starting point of bioinformatics workflows for fetching data before local processing.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/database-access/batch-downloads` — Download large datasets from NCBI efficiently using history server, batching, and rate limiting. Use when performing bulk sequence downloads, handling large query results, or production-scale data retrieval.
- `research/bioinformatics/database-access/blast-searches` — Run remote BLAST searches against NCBI databases using Biopython Bio.Blast. Use when identifying unknown sequences, finding homologs, or searching for sequence similarity against NCBI's nr/nt databases.
- `research/bioinformatics/database-access/entrez-fetch` — Retrieve records from NCBI databases using Biopython Bio.Entrez. Use when downloading sequences, fetching GenBank records, getting document summaries, or parsing NCBI data into Biopython objects.
- `research/bioinformatics/database-access/entrez-link` — Find cross-references between NCBI databases using Biopython Bio.Entrez. Use when navigating from genes to proteins, sequences to publications, finding related records, or discovering database relationships.
- `research/bioinformatics/database-access/entrez-search` — Search NCBI databases using Biopython Bio.Entrez. Use when finding records by keyword, building complex search queries, discovering database structure, or getting global query counts across databases.
- `research/bioinformatics/database-access/geo-data` — Query NCBI Gene Expression Omnibus (GEO) for expression datasets using Biopython Bio.Entrez. Use when finding microarray/RNA-seq datasets, downloading expression data, or linking GEO series to SRA runs.
- `research/bioinformatics/database-access/interaction-databases` — Query protein-protein and gene interaction databases including STRING, BioGRID, and IntAct via their REST APIs and Python clients. Retrieve interaction networks, confidence scores, and functional enrichment. Use when building protein interaction networks, contextualizing gene lists with known interactions, or retrieving pathway-level interaction data.
- `research/bioinformatics/database-access/local-blast` — Run local BLAST searches using BLAST+ command-line tools. Use when running fast unlimited searches, building custom databases, performing large-scale analysis, or when NCBI servers are slow or unavailable.
- `research/bioinformatics/database-access/sequence-similarity` — Find homologous sequences using iterative BLAST (PSI-BLAST), profile HMMs (HMMER), and reciprocal best hit analysis. Use when identifying orthologs, distant homologs, or protein family members where standard BLAST is not sensitive enough.
- `research/bioinformatics/database-access/sra-data` — Download sequencing data from NCBI SRA using the SRA toolkit. Use when downloading FASTQ files from SRA accessions, prefetching large datasets, or validating SRA downloads.
- `research/bioinformatics/database-access/uniprot-access` — Access UniProt protein database for sequences, annotations, and functional information. Use when retrieving protein data, GO terms, domain annotations, or protein-protein interactions.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.