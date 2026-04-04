import type { BuiltinSkill } from "../types"

export const pubmedSearchSkill: BuiltinSkill = {
  name: "pubmed-search",
  description: "PubMed literature search and article metadata retrieval for scientific topics",
  metadata: {
    category: "research/literature-pubmed",
    domain: "scientific-literature",
  },
  agent: "paper-evidence-synthesizer",
  allowedTools: ["Read(*)", "Bash(python:*)", "WebFetch(*)", "Bash(*)"],
  template: `# PubMed Search

Use this skill when the task is scientific literature search, citation gathering, or recent-paper lookup.

## Preferred tools

- BioPython Entrez
- PubMed web pages
- structured result tables

## Starter pattern

\`\`\`python
from Bio import Entrez
Entrez.email = "research@example.com"

handle = Entrez.esearch(db="pubmed", term="CRISPR delivery methods", retmax=20, sort="date")
record = Entrez.read(handle)
handle.close()
\`\`\`

## Output structure

- PMID
- title
- first author
- journal and year
- short abstract snippet
- PubMed URL

## Hard rules

- Never invent citations.
- Keep query strings explicit.
- Distinguish search retrieval from actual paper synthesis.
`,
}
