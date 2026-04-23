import type { BuiltinSkill } from "../types"

export const scrnaPreprocessingSkill: BuiltinSkill = {
  name: "scrna-preprocessing",
  description: "scRNA-seq preprocessing, QC, dimensionality reduction, and clustering with Scanpy-style workflows",
  metadata: {
    category: "research/single-cell-preprocessing",
    domain: "single-cell",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# scRNA Preprocessing And Clustering

Use this skill to turn raw or lightly processed scRNA-seq data into an analysis-ready object.

## Quick route

- already-processed \`h5ad\`: inspect \`adata.raw\`, embeddings, cluster columns, and QC metadata before rerunning preprocessing
- raw counts: do QC before normalization
- multiple batches: preprocess cleanly first, then decide whether integration is needed

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
3. Plot distributions before applying hard filters.
4. Apply explicit filtering thresholds.
5. Normalize, log-transform, and preserve raw counts.
6. Select HVGs, run PCA, neighbors, UMAP, and Leiden.
7. Export the processed object, QC figures, and cluster assignments.

## Starter pattern

\`\`\`python
import scanpy as sc

adata = sc.read_10x_mtx("counts/")
adata.var_names_make_unique()
adata.var["mt"] = adata.var_names.str.upper().str.startswith("MT-")
sc.pp.calculate_qc_metrics(adata, qc_vars=["mt"], inplace=True)
adata = adata[
    (adata.obs["n_genes_by_counts"] >= 200)
    & (adata.obs["n_genes_by_counts"] <= 6000)
    & (adata.obs["pct_counts_mt"] < 15),
    :
].copy()
sc.pp.filter_genes(adata, min_cells=3)
sc.pp.normalize_total(adata, target_sum=1e4)
sc.pp.log1p(adata)
adata.raw = adata.copy()
sc.pp.highly_variable_genes(adata, n_top_genes=3000, flavor="seurat_v3")
adata = adata[:, adata.var["highly_variable"]].copy()
sc.tl.pca(adata, svd_solver="arpack")
sc.pp.neighbors(adata, n_neighbors=15, n_pcs=30)
sc.tl.umap(adata)
sc.tl.leiden(adata, resolution=0.5, key_added="leiden_r05")
\`\`\`

## Expected artifacts

- \`results/processed.h5ad\`
- \`results/cluster_assignments.tsv\`
- \`qc/filter_summary.tsv\`
- \`qc/cell_qc_metrics.tsv\`
- \`figures/qc_violin.pdf\`
- \`figures/umap_leiden.pdf\`

## Hard rules

- do not silently drop cells or genes
- keep raw counts recoverable for later DE/pseudobulk
- do not interpret UMAP structure before checking QC and batch covariates
- use a small resolution grid when clustering if cluster stability matters
- state thresholds explicitly because they are assay- and tissue-dependent`,
}
