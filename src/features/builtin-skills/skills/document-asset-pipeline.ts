import type { BuiltinSkill } from "../types"

export const documentAssetPipelineSkill: BuiltinSkill = {
  name: "document-asset-pipeline",
  description: "Plan and integrate SVG, Mermaid, charts, screenshots, and user-provided images into DOCX, PPTX, PDF, or Markdown documents with captions and placement tracking",
  metadata: {
    category: "writing/document-asset-pipeline",
    domain: "document-assets",
  },
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Document Asset Pipeline

Use this skill when writing tasks involve:
- SVG
- Mermaid
- screenshots
- user-provided images
- charts
- diagrams
- figure-heavy documents or decks

## Asset handling protocol

1. inventory all assets before drafting the final document
2. preserve originals
3. create rendered outputs and office-friendly fallbacks where needed
4. assign each asset:
- an id
- a caption
- a target section or slide
- a source path
- a rendered path
- a fallback path if needed

## Suggested structure

- \`assets/incoming/\` for user originals
- \`diagrams/\` for Mermaid or editable diagram sources
- \`figures/\` for rendered SVG/PNG/PDF outputs
- \`assets/manifest.json\` for asset metadata

## Mermaid workflow

- keep source as \`.mmd\`
- render to \`.svg\` when possible
- generate \`.png\` fallback when the target format cannot reliably embed the SVG

## SVG workflow

- keep the original SVG
- use SVG directly for HTML/Markdown/PDF when practical
- prepare PNG fallback for DOCX/PPTX when needed

## User image workflow

- do not scatter user images through the document ad hoc
- assign caption, placement, and purpose first
- explicitly reference the figure in nearby prose

## Companion skills

- load \`brand-guidelines\` when assets need to follow a defined visual identity
- load \`doc-coauthoring\` when the document itself is evolving over several collaborative revision waves

## Output contract

- asset inventory
- placement plan
- caption list
- conversion notes
- final insertion mapping by section or slide`,
}
