import type { BuiltinSkill } from "../types"

export const proteomicsSkill: BuiltinSkill = {
  name: "proteomics",
  description: "Proteomics QC, abundance-matrix cleanup, missingness review, and differential protein analysis guidance",
  metadata: {
    category: "research/proteomics",
    domain: "bioinformatics",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(Rscript:*)", "Bash(*)"],
  template: `# Proteomics

Use this skill for DDA or DIA proteomics when the user needs QC, replicate review, protein-level matrices, or differential abundance.

## Core rules

- keep peptide-level and protein-level analyses distinct
- QC comes before differential analysis
- make missingness policy explicit
- record whether values are raw, normalized, or imputed

## Starter pattern

\`\`\`python
import pandas as pd

protein_df = pd.read_csv("protein_groups.tsv", sep="\\t")
sample_cols = [c for c in protein_df.columns if c.startswith("LFQ intensity")]
matrix = protein_df[sample_cols].replace(0, pd.NA)
qc = pd.DataFrame({
    "n_proteins": matrix.notna().sum(),
    "missing_pct": matrix.isna().mean() * 100,
})
qc.to_csv("qc/proteomics_qc_summary.tsv", sep="\\t")
\`\`\`

## Workflow

1. Clarify assay:
- DDA vs DIA
- peptide vs protein table
- PTM-enriched vs unenriched

2. QC:
- missingness
- replicate correlation
- batch structure
- intensity distributions

3. Normalize and summarize consistently.

4. Differential abundance:
- replicate-aware statistics
- explicit filtering and missingness handling

## Quality rules

- overall missingness above ~30% should trigger caution
- low replicate correlation deserves review before biological claims
- do not mix peptide and protein tables in one matrix without documenting aggregation logic

## Expected artifacts

- \`results/protein_abundance.tsv\`
- \`results/differential_proteins.tsv\`
- \`qc/proteomics_qc_summary.tsv\`
- \`figures/correlation_heatmap.pdf\`
- \`figures/missingness.pdf\``,
}
