import type { BuiltinSkill } from "../types"

export const workflowManagementSkill: BuiltinSkill = {
  name: "workflow-management",
  description: "Reusable Snakemake, Nextflow, WDL, and CWL workflow design for reproducible bioinformatics pipelines with containers and provenance",
  license: "MIT",
  metadata: {
    category: "research/bioinformatics-workflow-management",
    domain: "bioinformatics",
    imported_from: "GPTomics/bioSkills",
    source_category: "workflow-management",
  },
  agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Workflow Management

Use this skill when the task is to convert an analysis into a reproducible pipeline rather than a one-off script.

## Choose the framework by deployment target

- \`Nextflow\` for container-heavy portable pipelines and cloud/HPC execution
- \`Snakemake\` for Python-centric DAGs and approachable local-to-cluster scaling
- \`WDL\` or \`CWL\` when the surrounding platform already standardizes on them

## Mandatory workflow

1. Define inputs, outputs, and per-step contracts.
2. Separate process logic from configuration.
3. Pin references, containers, and tool versions.
4. Add resumable execution and per-step logging.
5. Emit a final QC/report aggregation step.

## Minimal Nextflow pattern

\`\`\`groovy
nextflow.enable.dsl=2

process FASTQC {
  input:
  tuple val(sample_id), path(reads)

  output:
  path("*.html"), emit: html

  script:
  """
  fastqc \${reads}
  """
}
\`\`\`

## Guardrails

- Do not hide hard-coded paths in process scripts.
- Every step should declare expected inputs and outputs.
- Keep samplesheet parsing and metadata normalization explicit.
- Prefer containerized or clearly documented environments over ad hoc system assumptions.

## Expected artifacts

- pipeline entrypoint (\`main.nf\`, \`Snakefile\`, or equivalent)
- config/profile files
- samplesheet schema or manifest
- per-step output directories
- resumable execution notes and QC aggregation step
`,
}
