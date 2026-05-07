# Engineering Modules

ExtendAI Lab should not keep expanding by dumping more and more static prompt
text into every agent. Instead, reusable guidance should gradually move into
standardized engineering modules that can be:

- documented clearly;
- reviewed in pull requests;
- injected in stages when needed;
- eventually exposed as on-demand prompt/skill modules.

Chinese version: [`engineering-modules.zh-CN.md`](engineering-modules.zh-CN.md)

## Why this layer exists

There are three different things that are easy to mix together:

1. **Base agent identity** — engineer, bio-analyst, planner, executor
2. **Discipline bias** — biology-first, chemistry-first, engineering-first
3. **Reusable behavioral constraints** — review rigor, anti-overconfidence,
   validation discipline, reproducibility discipline, visual QA discipline

The third group should not be hardcoded repeatedly into every agent prompt.
Those behaviors should become reusable engineering modules.

## Design goals

- Keep core prompts smaller and more stable.
- Let discipline prompts add only the bias they truly need.
- Make reusable constraints reviewable as documents, not scattered paragraphs.
- Prepare for future staged injection / on-demand loading.
- Give contributors one standard place and one standard format for PRs.

## Current target model

```text
Base agent
  + discipline overlay
  + engineering modules (staged or on-demand)
```

Examples:

- `bio-analyst` = engineer base + biology overlay + scientific rigor modules
- future chemistry expert = engineer base + chemistry overlay + same rigor modules
- planner = planner base + plan-quality / risk-review modules

## First standardized module family

The first family should focus on scientific rigor and anti-overconfidence.

That family should cover two directions at once:

1. **Self-review of model output**
   - separate observation, interpretation, hypothesis, speculation
   - identify evidence basis and uncertainty source
   - state next validation step

2. **Pushback on user-side scientific weakness**
   - call out causal overreach
   - call out missing controls / confounders / underpowered design
   - distinguish docking or prediction from experimental validation
   - distinguish exploratory signals from conclusions

## Proposed directory shape

```text
docs/engineering-modules/
  README.md
  README.zh-CN.md
  module-template.md
  module-template.zh-CN.md
  scientific-rigor.md
  scientific-rigor.zh-CN.md
  anti-overconfidence.md
  anti-overconfidence.zh-CN.md
```

The docs layer comes first. Runtime injection can evolve later.

## Standard module document contract

Every module document should contain the same sections:

1. **Purpose** — what failure mode this module prevents
2. **When to inject** — task stages / trigger conditions
3. **Required behaviors** — mandatory rules
4. **What it must reject or push back on**
5. **Output expectations** — how the model should reflect the discipline
6. **Related modules / related skills**
7. **Notes for contributors** — what not to bloat or duplicate

## Contribution rule

New reusable prompt discipline should not be merged as scattered prompt edits
first. Add or update the engineering module document, then wire prompts to it in
small targeted changes.

This keeps PR review simpler and reduces prompt drift between agents.

## PR checklist for module work

Before merging a new module, verify:

- the behavior is reusable across more than one agent or workflow;
- it is not just discipline-specific wording that belongs in one prompt;
- it has a clear injection trigger;
- it improves rigor without turning into rigid identity lock;
- docs are updated in both English and Chinese when the module changes
  architecture-level behavior.

## Next implementation path

1. Standardize the docs layer for engineering modules.
2. Extract the first scientific-rigor / anti-overconfidence module pair.
3. Add a diagnostics-strategy module so verification policy is not locked to LSP-only assumptions.
4. Reference those modules from architecture docs and contributing rules.
5. Later, add staged or on-demand runtime injection once the document layer is
   stable.
