import type { BuiltinSkill } from "../types"

export const functionalAnnotationSkill: BuiltinSkill = {
  name: "functional-annotation",
  description: "Protein and gene function lookup across UniProt, InterPro, KEGG, Reactome, STRING, and related annotation resources",
  metadata: {
    category: "research/functional-annotation",
    domain: "bioinformatics",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "WebFetch(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Functional Annotation

Use this skill when the task needs domains, pathways, protein families, target context, interaction networks, or resource-backed function summaries.

## Recommended source map

- UniProt: canonical protein annotation, names, reviewed functional notes
- InterPro: domains, repeats, families, functional sites
- KEGG: pathway membership and gene-pathway mapping
- Reactome: curated pathway and reaction context
- STRING: interaction neighborhoods and evidence-backed network context
- Open Targets or similar target resources: disease and target evidence when relevant

## Query workflow

1. Normalize identifiers first:
- gene symbol
- UniProt accession
- Ensembl identifier
- species context

2. Choose the right source for the question:
- domain architecture → InterPro
- pathway membership → KEGG / Reactome
- protein function summary → UniProt
- interaction neighborhood → STRING
- disease/target evidence → Open Targets

3. Separate evidence levels:
- reviewed / curated annotation
- computational annotation
- network association
- pathway co-membership

4. Export a compact evidence matrix:
- source
- identifier used
- hit / pathway / domain
- evidence type
- link or accession

## Example InterPro pattern

\`\`\`python
import requests

url = "https://www.ebi.ac.uk/interpro/api/protein/uniprot/P04637/entry/interpro"
response = requests.get(url, headers={"Accept": "application/json"})
response.raise_for_status()
data = response.json()
for result in data.get("results", []):
    print(result.get("metadata", {}).get("accession"), result.get("metadata", {}).get("name"))
\`\`\`

## Example KEGG pattern

\`\`\`python
import requests

response = requests.get("https://rest.kegg.jp/link/pathway/hsa:7157")
print(response.text)
\`\`\`

## Quality rules

- do not collapse pathway association into causal proof
- keep species explicit; human and mouse IDs are not interchangeable
- distinguish reviewed knowledge from predicted/domain-inferred annotations
- when multiple databases disagree, surface the disagreement instead of flattening it

## Expected artifacts

- \`results/annotation/functional_annotation.tsv\`
- \`results/annotation/pathway_membership.tsv\`
- \`results/annotation/domain_architecture.tsv\`
- optional \`figures/annotation_network.pdf\`

## Output contract

- identifiers and species used
- databases queried
- evidence matrix summary
- domains/pathways/interactions found
- caveats about annotation confidence and source limitations`,
}
