import type { BuiltinSkill } from "../types"

export const pathwayAnalysisSkill: BuiltinSkill = {
  name: "pathway-analysis",
  description: "GO, KEGG, Reactome, and GSEA-style pathway analysis with correct gene-universe handling and enrichment interpretation",
  license: "MIT",
  metadata: {
    category: "research/bioinformatics-pathway-analysis",
    domain: "bioinformatics",
    imported_from: "GPTomics/bioSkills",
    source_category: "pathway-analysis",
  },
  agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "WebFetch(*)", "Bash(Rscript:*)", "Bash(python:*)", "Bash(*)"],
  template: `# Pathway Analysis

Use this skill after differential results or ranked gene statistics exist and the task is enrichment, pathway interpretation, or leading-edge analysis.

## Decision rules

- Use GSEA when you have a ranked full gene list.
- Use ORA only when there is no meaningful ranking.
- Always make the background universe explicit for ORA.
- Convert gene identifiers before enrichment and keep the mapping table.

## Typical workflow

1. Inspect input:
- ranked list vs thresholded gene list
- organism
- gene ID type
2. Choose database:
- GO
- KEGG
- Reactome
- custom GMT/MSigDB
3. Run enrichment.
4. Review adjusted p-values, normalized enrichment score, and leading-edge genes.
5. Produce plots and a table that can be cited in the report.

## Starter pattern

\`\`\`r
library(clusterProfiler)

gene_list <- sort(gene_list, decreasing = TRUE)
gse <- gseGO(
  geneList = gene_list,
  OrgDb = org.Hs.eg.db,
  ont = "BP",
  minGSSize = 10,
  maxGSSize = 500,
  pvalueCutoff = 0.05,
  verbose = FALSE
)
\`\`\`

## Guardrails

- Never treat pathway names as evidence without checking member genes and directionality.
- High absolute enrichment score with weak FDR is not a publishable result.
- For ORA, document the tested background, not just the hit list.
- Keep upregulated and downregulated interpretations separate.

## Expected artifacts

- \`results/pathway_enrichment.tsv\`
- \`figures/gsea_enrichment.pdf\` or \`figures/pathway_dotplot.pdf\`
- ID-mapping table used for enrichment
- summary note describing database, universe, and ranking metric
`,
}
