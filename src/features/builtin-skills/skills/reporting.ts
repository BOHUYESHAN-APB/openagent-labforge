import type { BuiltinSkill } from "../types"

export const reportingSkill: BuiltinSkill = {
  name: "reporting",
  description: "Reproducible Quarto, R Markdown, Jupyter, and MultiQC reporting for bioinformatics analyses, figures, and handoff packages",
  license: "MIT",
  metadata: {
    category: "research/bioinformatics-reporting",
    domain: "bioinformatics",
    imported_from: "GPTomics/bioSkills",
    source_category: "reporting",
  },
  // agent: "scientific-writer",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(Rscript:*)", "Bash(*)"],
  template: `# Reporting

Use this skill when the task is to package results into a reproducible report, methods document, notebook, or handoff bundle.

## Preferred outputs

- \`Quarto\` for polished, reproducible HTML/PDF/Docx reports
- \`R Markdown\` when an existing R ecosystem workflow already exists
- \`Jupyter\` when exploratory Python notebooks need to be preserved
- \`MultiQC\` for cohort QC aggregation

## Mandatory workflow

1. Decide audience:
- internal analysis note
- reproducible methods report
- reader-facing results summary
2. Separate narrative, code, figures, and tables.
3. Record exact input files and parameters.
4. Render the report and verify links, figure paths, and table captions.
5. Keep the final handoff concise enough that another session can resume from it.

## Starter Quarto header

\`\`\`yaml
---
title: "Analysis Report"
format:
  html:
    toc: true
    code-fold: true
---
\`\`\`

## Guardrails

- Do not bury method assumptions outside the report metadata.
- Figures must be traceable to source tables or scripts.
- MultiQC is a supplement, not the whole report.
- Reader-facing conclusions must match the actual statistical output.

## Expected artifacts

- \`reports/*.qmd\` or \`reports/*.Rmd\`
- rendered HTML/PDF/Docx output
- figure and table export directory
- concise execution summary for checkpoint or cross-session handoff
`,
}
