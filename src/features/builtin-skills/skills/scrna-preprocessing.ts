import type { BuiltinSkill } from "../types"

export const scrnaPreprocessingSkill: BuiltinSkill = {
  name: "scrna-preprocessing",
  description: "scRNA-seq preprocessing, QC, dimensionality reduction, and clustering with Scanpy-style workflows",
  metadata: {
    category: "research/single-cell-preprocessing",
    domain: "single-cell",
  },
  agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# scRNA Preprocessing And Clustering

Use this skill to turn raw or lightly processed scRNA-seq data into an analysis-ready object.

## Preferred tools

- scanpy
- anndata
- pandas
- matplotlib / seaborn

## Workflow

1. Load and validate the object orientation.
2. Compute QC metrics:
   - n_genes_by_counts
   - total_counts
   - pct_counts_mt
3. Apply explicit filtering thresholds.
4. Normalize, log-transform, and preserve raw counts.
5. Select HVGs, run PCA, neighbors, UMAP, and Leiden.
6. Export the processed object and QC figures.

## Starter pattern

\`\`\`python
import scanpy as sc

adata = sc.read_10x_mtx("counts/")
adata.var_names_make_unique()
adata.var["mt"] = adata.var_names.str.upper().str.startswith("MT-")
sc.pp.calculate_qc_metrics(adata, qc_vars=["mt"], inplace=True)
sc.pp.normalize_total(adata, target_sum=1e4)
sc.pp.log1p(adata)
adata.raw = adata.copy()
sc.pp.highly_variable_genes(adata, n_top_genes=3000, flavor="seurat_v3")
sc.tl.pca(adata, svd_solver="arpack")
sc.pp.neighbors(adata, n_neighbors=15, n_pcs=30)
sc.tl.umap(adata)
sc.tl.leiden(adata, resolution=0.5, key_added="leiden_r05")
\`\`\`

## Expected artifacts

- \`results/processed.h5ad\`
- \`results/cluster_assignments.tsv\`
- \`qc/filter_summary.tsv\`
- \`figures/qc_violin.pdf\`
- \`figures/umap_leiden.pdf\`

## Hard rules

- Do not silently drop cells or genes.
- Keep raw counts recoverable for later DE/pseudobulk.
- Do not interpret UMAP structure before checking QC and batch covariates.
`,
}
