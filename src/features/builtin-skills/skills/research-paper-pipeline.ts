import type { BuiltinSkill } from "../types"

export const researchPaperPipelineSkill: BuiltinSkill = {
  name: "research-paper-pipeline",
  description: "Top-conference research paper pipeline with real literature, real experiments, iterative revision, and anti-fabrication gates",
  metadata: {
    category: "research/paper-pipeline",
    domain: "research-paper-writing",
  },
  agent: "scientific-writer",
  allowedTools: ["Read(*)", "WebFetch(*)", "Bash(python:*)", "Bash(Rscript:*)", "Bash(*)"],
  template: `# Research Paper Pipeline

Use this skill when the task is to design, run, and write a serious research paper rather than produce a one-off summary.

## Pipeline

1. Read the local paper plan, experiment notes, and restrictions first.
2. Define the research question, core claims, and evidence needed.
3. Collect real literature from real sources and preserve citations.
4. Design experiments before writing results.
5. Run only real experiments with reproducible code and saved artifacts.
6. Analyze results, decide whether to refine or pivot, and loop at least once when the evidence is weak.
7. Draft the paper with explicit section goals, then revise against evidence and reviewer-style criticism.

## Non-negotiable rules

- Do not fabricate results, citations, datasets, trial counts, or statistical tests.
- Do not present environment setup, dependency failures, or debugging logs as research contributions.
- Do not claim a method, ablation, or theorem that the code and notes do not support.
- Do not reduce a top-conference paper into a short blog-style summary.
- Keep claims tied to saved results, scripts, and references.

## Experiment discipline

- Run a pilot first and estimate total runtime before large sweeps.
- Use real objective functions, real metrics, and convergence checks.
- Record seeds, hyperparameters, environment details, and artifact paths.
- If NaN, Inf, or unstable behavior appears, fix the root cause instead of masking it.
- Strong baselines and ablations are mandatory when the paper claims component-level gains.

## Writing discipline

- Keep the abstract stable unless the evidence forces a correction.
- Introduction and method sections must explain the real technical novelty, not just the workflow.
- Related work must be relevant and recent enough for the target venue.
- Results must match actual tables, logs, and scripts exactly.
- Limitations must be explicit, not buried.

## Output contract

- paper plan and progress log
- literature table with citation keys and URLs/DOIs where available
- experiment code and result artifacts
- draft sections with evidence-backed claims
- revision notes describing what changed between iterations
`,
}
