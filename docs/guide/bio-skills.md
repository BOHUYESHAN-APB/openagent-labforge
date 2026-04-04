# Bio Skills Guide

This document describes the current Labforge bioinformatics skill surface as an
execution system, not as generic prompt decoration.

## Bio Agent Shape

Top-level bio entrypoints:

- `bio-orchestrator`: integrated bio task coordination
- `bio-pipeline-operator`: execution-heavy bio task delivery

Internal bio specialists:

- `bio-methodologist`: study framing, QC, and statistical planning
- `wet-lab-designer`: user-executed wet-lab validation design
- `paper-evidence-synthesizer`: literature evidence matrix and confidence grading

The default rule is:

- use skills to narrow the work
- use internal specialists when the task crosses a specialist boundary
- avoid adding new top-level bio agents unless the responsibility becomes stable,
  separate, and tool-distinct

## Skill Layout

Builtin bio skills live under:

- `src/features/builtin-skills/skills/`

Naming and structure conventions:

- one responsibility per file
- kebab-case file names and skill names
- each skill should declare:
  - `name`
  - `description`
  - `metadata.category`
  - `metadata.domain`
  - `agent`
  - `allowedTools`
  - `template`

Each bio skill template should explain:

- when to load the skill
- preferred tools
- workflow or decision sequence
- expected artifacts
- hard rules and boundaries

## Current Skill Ownership

Planning and evidence:

- `bio-methods` -> `bio-methodologist`
- `wet-lab-design` -> `wet-lab-designer`
- `paper-evidence` -> `paper-evidence-synthesizer`
- `pubmed-search` -> `paper-evidence-synthesizer`
- `geo-query` -> `paper-evidence-synthesizer`
- `vector-design` -> `wet-lab-designer`

Execution and analysis:

- `bio-pipeline` -> `bio-pipeline-operator`
- `bio-tools` -> shared reference, usually loaded by `bio-orchestrator` or `bio-pipeline-operator`
- `bio-visualization` -> `bio-pipeline-operator`
- `differential-expression` -> `bio-pipeline-operator`
- `scrna-preprocessing` -> `bio-pipeline-operator`
- `cell-annotation` -> `bio-pipeline-operator`
- `sequence-analysis` -> `bio-pipeline-operator`
- `structural-biology` -> `bio-pipeline-operator`

## Preferred Tooling Policy

Environment policy:

- Python-first workflows: prefer `uv`
- mixed native stacks or heavy compiled dependencies: prefer `conda`
- on Windows, call out WSL/Linux early when the practical path requires it

Bio tool categories:

- Python and R:
  - `BioPython`
  - `scanpy`
  - `anndata`
  - `pandas`
  - `PyDESeq2`
  - `DESeq2`
  - `ggplot2`
  - `ComplexHeatmap`
- native and CLI:
  - `samtools`
  - `bedtools`
  - `bcftools`
  - `bwa`
  - `minimap2`
  - `BLAST+`
  - `HMMER`
  - `DIAMOND`
- optional commercial or semi-commercial paths:
  - `SnapGene`
  - `Geneious`
  - `Benchling`

When a commercial path is mentioned, the skill should separate:

- what can be done with open tools
- what requires the commercial product
- what the user must do manually

## Standard Bio Workflow

The normal bio workflow should look like this:

1. Clarify the biological question and decision target.
2. Request minimum decisive data and metadata.
3. Load the relevant planning or evidence skills.
4. Produce a method or evidence handoff before execution.
5. Run the execution skill stack with explicit artifact paths.
6. Record outputs, QC checks, and residual uncertainty.
7. If needed, design user-executed wet-lab validation and request the return data format.

## Plotting And Figure Policy

When producing biological figures:

- do not default to linear color scales if the data are skewed
- prefer perceptually uniform palettes
- record transform and normalization choices explicitly
- export vector outputs by default when the figure may enter a report or paper

The default plotting skill is:

- `bio-visualization`

## Boundary Rules

Bio skills must not:

- pretend a wet-lab step was executed when it was only designed
- hide missing metadata or weak controls
- claim environment reproducibility without versions and commands
- claim analysis completion without verified artifacts

Bio skills should:

- request required data explicitly
- separate required from optional context
- leave clear artifact paths for downstream review
- keep private data handling explicit and controlled
