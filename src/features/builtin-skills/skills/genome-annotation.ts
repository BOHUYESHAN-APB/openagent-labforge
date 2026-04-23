import type { BuiltinSkill } from "../types"

export const genomeAnnotationSkill: BuiltinSkill = {
  name: "genome-annotation",
  description: "Prokaryotic and eukaryotic genome annotation workflows covering structural prediction, functional annotation, repeats, and submission-ready outputs",
  license: "MIT",
  metadata: {
    category: "research/bioinformatics-genome-annotation",
    domain: "bioinformatics",
    imported_from: "GPTomics/bioSkills",
    source_category: "genome-annotation",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Genome Annotation

Use this skill when an assembled genome needs structural and functional annotation.

## Decision rules

- Prokaryotic genomes: prefer \`Bakta\`; use \`Prokka\` only when a lightweight legacy path is required.
- Eukaryotic genomes: use gene-prediction aware tools such as \`BRAKER\` and follow with functional annotation.
- Repeat masking, ncRNA detection, and orthology-based annotation are separate stages; do not collapse them into one vague step.

## Mandatory workflow

1. Classify the assembly:
- prokaryotic vs eukaryotic
- draft vs complete
- expected genome size and complexity
2. Run structural annotation.
3. Run functional annotation or transfer.
4. QC the result:
- gene count sanity
- coding density
- BUSCO or equivalent completeness review
5. Export submission- and downstream-friendly files.

## Starter pattern

\`\`\`bash
bakta \
  --db /path/to/bakta_db \
  --output bakta_out \
  --prefix sample \
  --locus-tag SAMPLE \
  --threads 8 \
  assembly.fasta
\`\`\`

\`\`\`bash
busco -i bakta_out/sample.faa -m proteins -l bacteria_odb10 -o busco_proteins
\`\`\`

## Guardrails

- Annotation is only as good as the assembly and taxonomy assumptions.
- Flag incompatible translation tables, contaminated assemblies, or unrealistic gene counts.
- Keep repeat annotation, ncRNA annotation, and functional annotation provenance explicit.

## Expected artifacts

- \`annotation/*.gff3\`
- \`annotation/*.gbff\`
- \`annotation/*.faa\`
- \`annotation/*.ffn\`
- BUSCO or annotation QC summaries
- note describing toolchain and database version assumptions
`,
}
