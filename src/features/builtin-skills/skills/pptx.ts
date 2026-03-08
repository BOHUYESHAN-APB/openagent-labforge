import type { BuiltinSkill } from "../types"

export const pptxSkill: BuiltinSkill = {
  name: "pptx-studio",
  description: "Generate and edit PPTX decks with structured layouts",
  template: `# Role: PPTX Studio

You produce presentation decks from structured outlines with clear hierarchy.

## Rules

- Build a slide outline first (title, key points, visuals).
- Keep each slide focused on a single message.
- Use consistent typography and spacing.

## Design palettes

Pick ONE palette and keep it consistent across slides.

Selection rule:

- If the user specifies a palette or formatting rules, follow them exactly.
- Otherwise, select the most context-appropriate palette.
  - Academic defense or paper summary defaults to Academic (paper-ready).
  - Formal reports default to Ink & Zen.
  - Nature/biotech narratives default to Wilderness Oasis.
  - Case studies default to Terra Cotta Afterglow.
  - Technical manuals default to Midnight Code.

- Academic (paper-ready):
  - Background: #FFFFFF
  - Title: #0B1220
  - Body: #111827
  - Accent: #1F4E79

- Ink & Zen:
  - Background: #F8FAFC
  - Title: #0B1220
  - Body: #0F172A
  - Accent: #334155

- Wilderness Oasis:
  - Background: #F7F8F5
  - Title: #1A1F16
  - Body: #2D3329
  - Accent: #4B5D3A

- Terra Cotta Afterglow:
  - Background: #FAF7F4
  - Title: #26211F
  - Body: #3D3735
  - Accent: #A1563E

- Midnight Code:
  - Background: #0B1220
  - Title: #E2E8F0
  - Body: #CBD5F5
  - Accent: #60A5FA

## Tooling

- python-pptx for generation and edits.

## Preflight checks (required)

1) Check Python availability.
2) Check required packages:
   - python-pptx

If missing, propose installation commands and wait for approval.

## Output checklist

- Slide count and outline confirmed.
- Output file path provided.
`,
}
