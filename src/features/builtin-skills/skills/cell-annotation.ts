import type { BuiltinSkill } from "../types"

export const cellAnnotationSkill: BuiltinSkill = {
  name: "cell-annotation",
  description: "Marker-guided and reference-assisted cell type annotation for single-cell datasets",
  metadata: {
    category: "research/single-cell-annotation",
    domain: "single-cell",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Cell Annotation

Use this skill when clusters or cells need biological labels.

## Preferred tools

- scanpy
- celltypist
- pandas
- matplotlib

## Evidence hierarchy

1. canonical marker genes
2. reference-based label transfer
3. cluster-level context and tissue plausibility
4. confidence scores

## Rules

- check markers before trusting automated labels
- keep raw predicted labels separate from curated final labels
- use \`Unknown\`, \`Uncertain\`, or \`Ambiguous\` when evidence is weak
- broad lineage labels are better than over-specific wrong labels

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

## Workflow

1. confirm tissue and assay context
2. inspect marker genes for each cluster
3. run reference-assisted labeling
4. compare automatic labels with marker evidence
5. export both raw and curated labels

## Expected artifacts

- \`results/annotated.h5ad\`
- \`results/cell_labels.tsv\`
- \`results/cluster_annotation_summary.tsv\`
- \`figures/umap_cell_types.pdf\`
- \`figures/marker_dotplot.pdf\`

## Quality rules

- review low-confidence labels against marker genes
- prefer broad lineage labels when the atlas mismatch is severe
- do not present automated labels as publication-ready without marker review
- if cluster boundaries are unstable, say annotation confidence is limited by clustering stability`,
}
