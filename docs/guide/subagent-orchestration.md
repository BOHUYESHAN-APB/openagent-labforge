# Subagent Orchestration and Task Relations (with Multimodal-Looker)

## 1. Built-in agent landscape

Source of truth: built-in registry and schema.

- Top-level orchestrators (primary or all; not normal leaf delegation targets)
1. sisyphus
2. wase
3. hephaestus
4. atlas
5. prometheus (plan family)
6. sisyphus-junior (category-spawned executor)

- Specialist callable agents (subagent or all)
1. oracle
2. librarian
3. explore
4. github-scout
5. tech-scout
6. acceptance-reviewer
7. article-writer
8. scientific-writer
9. bio-autopilot
10. bio-orchestrator
11. multimodal-looker
12. bio-methodologist
13. wet-lab-designer
14. bio-pipeline-operator
15. paper-evidence-synthesizer
16. metis
17. momus

## 2. Multimodal-Looker definition and boundary

- mode: subagent
- purpose: semantic interpretation for visual/document media (PDF, image, chart, embedded media)
- output style: extraction findings and interpretation results for the main agent, not raw literal dumps
- tools: minimal-privilege read-only profile

Execution path:

1. look_at assembles file parts (local file, directory images, DOCX/PPTX embedded media)
2. send to multimodal-looker child session
3. return concise semantic findings to the orchestrator

Boundary:

1. not the default path for plain text/code literal reads
2. not a file editor
3. not an image generation backend

## 3. Delegation principles

- Principle A: orchestrators coordinate, specialists execute focused evidence work.
- Principle B: visual/document interpretation converges to multimodal-looker.
- Principle C: writing and evidence extraction stay separated.
  - extraction: multimodal-looker / librarian / paper-evidence-synthesizer
  - writing: article-writer / scientific-writer
- Principle D: quality loops are explicit.
  - acceptance-reviewer for requirement-level acceptance
  - momus for plan/reasoning quality checks

## 4. Standard flow for figure placement in papers

Use case: user provides crop images, office docs with embedded figures, and AI-generated figures that must be placed into proper sections.

1. Orchestrator receives writing objective.
2. For image directories: look_at batches images to multimodal-looker for semantic tagging and purpose hints.
3. For DOCX/PPTX: look_at extracts embedded images and requests section-placement candidates.
4. Orchestrator drafts text via article-writer or scientific-writer.
5. Re-run multimodal review for generated figures to validate semantic consistency.
6. Final pass by acceptance-reviewer (and momus when high-accuracy review is required).

## 5. Image generation roadmap note

Current stance:

1. generation backend remains configuration-gated
2. default behavior remains SVG-first fallback when no backend exists
3. external image-platform API requirement collection is in progress

Until API contracts stabilize, keep generation workflows optional and avoid pretending full backend availability.
