import type { BuiltinSkill } from "../types"

export const blastSearchSkill: BuiltinSkill = {
  name: "blast-search",
  description: "BLAST similarity and homology search for nucleotide or protein queries using local BLAST+ or remote NCBI workflows",
  metadata: {
    category: "research/sequence-homology-search",
    domain: "bioinformatics",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "WebFetch(*)", "Bash(python:*)", "Bash(*)"],
  template: `# BLAST Search

Use this skill when the task needs sequence identification, homology search, conservation review, or candidate ortholog/paralog discovery.

## Program selection

| Query | Target database | Program |
|---|---|---|
| nucleotide | nucleotide | \`blastn\` |
| protein | protein | \`blastp\` |
| nucleotide | protein | \`blastx\` |
| protein | translated nucleotide | \`tblastn\` |

## Workflow

1. Confirm the biological question:
- identify an unknown sequence
- find close homologs
- compare conservation across species
- validate whether a construct or amplicon matches expectation

2. Confirm runtime path:
- local BLAST+ if reference files or local databases exist
- remote NCBI/BioPython path if public database search is acceptable

3. Record search parameters:
- database or subject
- e-value threshold
- max target count
- identity / coverage interpretation rules

4. Export a usable result table:
- accession or hit name
- identity
- coverage
- e-value
- bitscore
- species / source if available

## Local starter pattern

\`\`\`bash
blastn -query query.fa -subject subject.fa -outfmt "6 qseqid sseqid pident length qcovs evalue bitscore"
\`\`\`

## Remote starter pattern

\`\`\`python
from Bio.Blast import NCBIWWW, NCBIXML

sequence = "ATGCGATCGATCGATCG"
result_handle = NCBIWWW.qblast("blastn", "nt", sequence)
blast_records = NCBIXML.parse(result_handle)
for record in blast_records:
    for alignment in record.alignments[:10]:
        for hsp in alignment.hsps[:1]:
            print(alignment.title, hsp.expect, hsp.identities / hsp.align_length)
\`\`\`

## Quality rules

- do not interpret top hit name alone as proof of function
- inspect both identity and coverage; high identity on a tiny alignment is not enough
- state which database and version/path were used
- if the question is about function or domains, hand off to \`functional-annotation\` after BLAST instead of guessing from sequence names

## Expected artifacts

- \`results/blast/top_hits.tsv\`
- \`results/blast/raw.outfmt6.tsv\`
- \`results/blast/query.fa\`
- optional \`results/blast/alignment_summary.md\`

## Output contract

- BLAST program chosen and why
- database / subject used
- key thresholds
- top-hit summary with identity and coverage
- follow-up recommendation if domain/pathway interpretation is needed`,
}
