import type { BuiltinSkill } from "../types"

export const bioVisualizationSkill: BuiltinSkill = {
  name: "bio-visualization",
  description: "Publication-grade bioinformatics visualization, including nonlinear color mapping, perceptual palettes, and figure export",
  metadata: {
    category: "research/bioinformatics-visualization",
    domain: "bio-visualization",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(Rscript:*)", "Bash(*)"],
  template: `# Bio Visualization

Use this skill for biological figures, heatmaps, score maps, enrichment plots, pathway diagrams, and result panels.

## Preferred tools

- Python: matplotlib, seaborn, plotnine, scanpy plotting
- R: ggplot2, ComplexHeatmap, pheatmap
- optional vector post-processing: SVG / PDF export for downstream editing

## Critical visualization rules

- Choose scales that fit the data distribution instead of defaulting to linear color ramps.
- If values are highly skewed, sparse, heavy-tailed, or clustered near zero, consider:
  - log transform
  - symlog
  - quantile scaling
  - clipped or robust normalization
- Prefer perceptually uniform palettes for continuous values.
- Use diverging palettes only when zero or another biologically meaningful midpoint matters.
- Do not use rainbow palettes for quantitative biological data.

## Heatmap and score-map guidance

- Linear mapping is often wrong for non-linear biological data.
- For skewed matrices, first inspect distribution, then decide:
  - robust z-score
  - row scaling
  - percentile clipping
  - log1p transform
- State the transformation in figure notes or metadata.

## Output standards

- default export: \`.pdf\` or \`.svg\` for publication
- raster only when explicitly needed
- include figure title, axis labels, legend title, and units
- keep figure generation code reproducible

## Figure review checklist

- does the color map exaggerate or hide the real dynamic range
- is the transformation stated explicitly
- are units and group labels understandable without the notebook context
- is the export vector-first when the figure may enter a paper or slide
- are multiple panels visually aligned and consistent

## Output contract

- chosen plotting stack
- transform / normalization used
- color strategy and why
- output figure paths
- follow-up editing recommendations if vector export is needed
- figure review notes and caveats
`,
}
