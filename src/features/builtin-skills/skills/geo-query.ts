import type { BuiltinSkill } from "../types"

export const geoQuerySkill: BuiltinSkill = {
  name: "geo-query",
  description: "Query NCBI GEO for public expression datasets and accession summaries",
  metadata: {
    category: "research/public-dataset-discovery",
    domain: "gene-expression-datasets",
  },
  agent: "paper-evidence-synthesizer",
  allowedTools: ["Read(*)", "Bash(python:*)", "WebFetch(*)", "Bash(*)"],
  template: `# GEO Dataset Query

Use this skill when the user wants public expression datasets, GEO accessions, or disease/tissue expression studies.

## Preferred tools

- BioPython Entrez
- NCBI GEO summaries

## Starter pattern

\`\`\`python
from Bio import Entrez

Entrez.email = "research@example.com"
handle = Entrez.esearch(db="gds", term='"breast cancer" AND "RNA-seq" AND gse[ETYP]', retmax=10)
record = Entrez.read(handle)
handle.close()
\`\`\`

## Expected outputs

- GEO accession
- title
- platform
- sample count
- short summary
- GEO URL

## Hard rules

- Distinguish dataset discovery from actual download and downstream analysis.
- Keep organism and assay filters explicit.
- Do not assume a GEO series is directly analysis-ready without checking metadata and raw data availability.
`,
}
