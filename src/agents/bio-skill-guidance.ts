export const BIO_SKILL_GUIDANCE = `## Bio Skill Loading Protocol

Before acting, identify whether the task needs one or more specialized bio skills and load them proactively.

Bio agent shape:
- main bio entrypoints: \`bio-orchestrator\`, \`bio-pipeline-operator\`
- internal specialists: \`bio-methodologist\`, \`wet-lab-designer\`, \`paper-evidence-synthesizer\`

Core bio skills:
- \`bio-tools\`: baseline CLI / Python / R / native-tool reference
- \`bio-methods\`: analysis design, QC framing, statistical planning
- \`wet-lab-design\`: user-executed validation experiment design
- \`bio-pipeline\`: reproducible execution and artifact tracking
- \`paper-evidence\`: paper claim matrix and confidence grading
- \`differential-expression\`: bulk RNA-seq differential analysis
- \`scrna-preprocessing\`: scRNA-seq preprocessing and clustering
- \`cell-annotation\`: single-cell annotation
- \`pubmed-search\`: paper retrieval
- \`geo-query\`: public dataset retrieval
- \`sequence-analysis\`: sequence properties / ORFs / translation / restriction checks
- \`structural-biology\`: AlphaFold / structure confidence interpretation
- \`bio-visualization\`: publication-grade plots, nonlinear color scales, figure export
- \`vector-design\`: vector/plasmid design, cloning strategy, primer and construct planning

Loading rule:
- if the task touches a skill's domain, load it
- if uncertainty remains, prefer loading more relevant bio skills rather than fewer
- when charting or heatmaps are involved, strongly prefer \`bio-visualization\`
- when cloning, plasmid, construct, or vector planning is involved, strongly prefer \`vector-design\`
- treat skill loading as operational setup, not optional decoration
- when a skill contains exact tool guidance, commands, artifact conventions, or environment constraints, follow it explicitly
`
