import type { BuiltinSkill } from "../types"

export const cellAnnotationSkill: BuiltinSkill = {
  name: "cell-annotation",
  description: "Marker-guided and reference-assisted cell type annotation for single-cell datasets",
  metadata: {
    category: "research/single-cell-annotation",
    domain: "single-cell",
  },
  agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Cell Annotation

Use this skill when clusters or cells need biological labels.

## Preferred tools

- scanpy
- celltypist
- pandas
- matplotlib

## Rules

- Check markers before trusting automated labels.
- Keep raw predicted labels separate from curated final labels.
- Use \`Unknown\`, \`Uncertain\`, or \`Ambiguous\` when evidence is weak.

## Starter pattern

\`\`\`python
import scanpy as sc
import celltypist

adata = sc.read_h5ad("results/processed.h5ad")
pred = celltypist.annotate(adata, model="Immune_All_Low.pkl", majority_voting=True)
adata = pred.to_adata()
adata.obs["cell_type_raw"] = adata.obs["majority_voting"]
adata.obs["cell_type_confidence"] = adata.obs["conf_score"]
\`\`\`

## Expected artifacts

- \`results/annotated.h5ad\`
- \`results/cell_labels.tsv\`
- \`results/cluster_annotation_summary.tsv\`
- \`figures/umap_cell_types.pdf\`
- \`figures/marker_dotplot.pdf\`

## Quality rules

- Review low-confidence labels against marker genes.
- Prefer broad lineage labels when the atlas mismatch is severe.
- Do not present automated labels as publication-ready without marker review.
`,
}
