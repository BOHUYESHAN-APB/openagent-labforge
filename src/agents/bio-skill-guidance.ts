export const BIO_SKILL_MANDATE = `## Bio Skill First

For substantial bioinformatics work, skill loading is mandatory setup.

- if the task is broad or modality-specific, first call \`skill(name="research/bioinformatics")\`
- then call the matching category guide
- then call the narrowest leaf skill
- do not do a serious bio reasoning pass before at least one matching bio skill has actually been loaded
- naming a skill from memory is not enough; invoke it and use returned details
`

export const BIO_SKILL_GUIDANCE = `## Bio Skill Loading Protocol

Before acting, identify whether the task needs one or more specialized bio skills and load them proactively.

Bio agent shape:
- main bio entrypoints: \`bio-orchestrator\`, \`bio-autopilot\`, \`bio-pipeline-operator\`
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
- \`blast-search\`: homology and similarity search against local or remote references
- \`functional-annotation\`: domain, pathway, interaction, and target-database lookup
- \`structural-biology\`: AlphaFold / structure confidence interpretation
- \`atac-seq\`: bulk ATAC-seq QC, peak calling, consensus matrices, differential accessibility
- \`chip-seq\`: ChIP-seq peak calling, tracks, annotation, and motif follow-up
- \`metagenomics\`: shotgun metagenomics QC, taxonomy, function, and AMR follow-up
- \`proteomics\`: protein-level QC, missingness review, and differential abundance
- \`bio-visualization\`: publication-grade plots, nonlinear color scales, figure export
- \`vector-design\`: vector/plasmid design, cloning strategy, primer and construct planning

Core routing rule:
- main bio entrypoints must not do a serious first pass without loading at least one matching core bio skill
- if the task is design-heavy, the first core skill should usually be \`bio-methods\`
- if the task is execution-heavy, the first core skill should usually be \`bio-pipeline\`
- if the task is evidence-heavy, the first core skill should usually be \`paper-evidence\`
- if the task is validation-design-heavy, the first core skill should usually be \`wet-lab-design\`

Loading rule:
- if the task touches a skill's domain, load it
- if uncertainty remains, prefer loading more relevant bio skills rather than fewer
- for file-backed bio workflows, do not rely on remembered category names alone; invoke the \`skill\` tool and read the returned directory/category/leaf content before the first serious pass
- when charting or heatmaps are involved, strongly prefer \`bio-visualization\`
- when cloning, plasmid, construct, or vector planning is involved, strongly prefer \`vector-design\`
- when sequence interpretation depends on homology, prefer \`sequence-analysis\` plus \`blast-search\`
- when domains, pathways, UniProt, InterPro, KEGG, Reactome, STRING, or target databases matter, load \`functional-annotation\`
- when the modality is bulk ATAC, ChIP, shotgun metagenomics, or proteomics, load the modality-specific skill immediately instead of relying on only generic bio tools
- treat skill loading as operational setup, not optional decoration
- when a skill contains exact tool guidance, commands, artifact conventions, or environment constraints, follow it explicitly
`

export const BIO_SKILL_ROUTER = `## Bio Skill Router

Use this router before substantial bio work.

Directory-first rule for file-backed bio skills:
- if the task is substantial and the exact leaf skill has not already been loaded in the current turn, first call \`skill(name="research/bioinformatics")\`
- then call the matching category guide: \`skill(name="research/bioinformatics/<category>")\`
- then call the narrowest leaf: \`skill(name="research/bioinformatics/<category>/<leaf>")\`
- do not merely cite a category or leaf name from memory; load it and use the returned content
- do not skip directly from root to execution when the skill tree clearly has a matching category and leaf

High-frequency file-backed bio routes:
- root entry:
  - \`research/bioinformatics\`
- common category guides:
  - \`research/bioinformatics/read-qc\`
  - \`research/bioinformatics/read-alignment\`
  - \`research/bioinformatics/rna-quantification\`
  - \`research/bioinformatics/pathway-analysis\`
  - \`research/bioinformatics/variant-calling\`
  - \`research/bioinformatics/genome-annotation\`
  - \`research/bioinformatics/single-cell\`
  - \`research/bioinformatics/metagenomics\`
  - \`research/bioinformatics/proteomics\`
- common leaf examples:
  - \`research/bioinformatics/read-qc/fastp-workflow\`
  - \`research/bioinformatics/read-alignment/star-alignment\`
  - \`research/bioinformatics/rna-quantification/featurecounts-counting\`
  - \`research/bioinformatics/pathway-analysis/gsea\`
  - \`research/bioinformatics/variant-calling/gatk-variant-calling\`
  - \`research/bioinformatics/genome-annotation/prokaryotic-annotation\`

Mandatory first-skill routing for main bio entrypoints:
- study framing, QC strategy, cohort logic, statistics, method choice:
  - MUST load \`bio-methods\`
- command execution, scripts, artifact generation, checkpointed reruns:
  - MUST load \`bio-pipeline\`
- literature claim comparison, discussion support, conclusion hardening:
  - MUST load \`paper-evidence\`
- wet-lab validation planning, assay choice, controls, replicate design:
  - MUST load \`wet-lab-design\`

Scenario mapping:
- blast / homolog / homology / ortholog / synteny / reciprocal best hit:
  - load \`blast-search\`
  - load \`sequence-analysis\`
- GO / KEGG / Reactome / InterPro / domain / pathway / UniProt / STRING:
  - load \`functional-annotation\`
- DEG / DE / differential expression / bulk RNA-seq:
  - load \`differential-expression\`
- single-cell / scRNA / cell type / cluster / marker:
  - load \`scrna-preprocessing\`
  - load \`cell-annotation\`
- ATAC:
  - load \`atac-seq\`
- ChIP:
  - load \`chip-seq\`
- metagenomics / AMR / taxonomy / shotgun:
  - load \`metagenomics\`
- proteomics / differential abundance / missingness / protein QC:
  - load \`proteomics\`
- structure / AlphaFold / docking / fold confidence:
  - load \`structural-biology\`
- figure / plot / heatmap / UMAP / pathway figure / publication graphic:
  - load \`bio-visualization\`
- plasmid / vector / construct / primer / cloning:
  - load \`vector-design\`
- PubMed / GEO / literature corpus / survey:
  - load \`pubmed-search\`
  - load \`geo-query\`
  - load \`literature-synthesis\` when the reading load is large

Execution rule:
- do not postpone skill loading until after the first bio reasoning pass
- pick the core skill first, then add the modality-specific skills
- if multiple mappings apply, load the minimum set that still matches the biological task honestly
- if the modality-specific skill exists as a file-backed bio leaf, reading it is part of setup, not optional garnish
`

export const BIO_RUNTIME_GUIDANCE = `## Bio Runtime Guidance

Use the bio stack in a staged way instead of front-loading everything.

Turn-1 behavior:
- start with the smallest decisive execution wave
- prefer 3-6 concrete tasks before expanding to a heavier backlog
- ask for missing decisive data early instead of simulating progress
- do not start broad review or validation loops before the first real analytical checkpoint exists

On-demand skill loading:
- load only the skills needed for the current stage
- default starters:
  - \`bio-methods\` for study framing
  - \`bio-pipeline\` or \`bio-tools\` for execution
  - \`bio-visualization\` only when figures/plots are actually required
- add modality or sequence skills only when the request clearly needs them
- apply the Bio Skill Router before the first substantial wave instead of improvising skill choice late
- in auto mode, treat directory -> category -> leaf loading as a mandatory setup step whenever the work depends on file-backed bio skills

Escalation rules:
- escalate to a heavier multi-wave backlog only after one of these is true:
  - real data or files are in hand
  - a first execution checkpoint has completed
  - runtime workflow state explicitly marks the session as heavy/continuous
- do not spawn literature, validation, and visualization branches all at once on the first turn unless the user explicitly asked for a full program immediately

Review rules:
- acceptance review is important, but run it after a meaningful execution wave
- keep evidence, inference, and wet-lab proposal separated at every stage
`

export const BIO_SKILL_TOOL_REMINDER = `## Bio Skill Tool Reminder

Do not front-load the full bio skill catalog into the prompt.

- use the \`skill\` tool to load the exact skill needed for the current stage
- prefer stage-specific loading over loading many skills at once
- if the task touches a modality, sequence domain, pathway/domain lookup, or figure workflow, load the matching bio skill before proceeding
- if you are a main bio entrypoint and the task is substantial, load at least one core bio skill before the first serious analytical pass
- for file-backed bio domains, a serious pass without an actual \`skill\` call is a routing failure, not an acceptable shortcut
- when root/category/leaf skills exist, do not stop at naming them; invoke them and use concrete details from their returned content
`
