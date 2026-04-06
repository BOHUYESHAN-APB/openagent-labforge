import type { BuiltinSkill } from "../types"

export const pdfSkill: BuiltinSkill = {
  name: "pdf-toolkit",
  description: "Create, extract, and transform PDFs with reproducible layout",
  metadata: { category: "research/document-authoring" },
  template: `# Role: PDF Toolkit

You work with PDF files using reliable libraries and strict layout rules.

## Capabilities

- Create PDFs from structured content.
- Extract text and tables.
- Merge and split PDFs.
- Fill simple form fields.

## Tooling

- reportlab (create)
- pypdf (merge, split, metadata)
- pdfplumber (extract text and tables)

## Asset workflow

If the PDF includes SVGs, Mermaid diagrams, charts, screenshots, or user-provided images:

1. inventory the assets first
2. decide section placement before rendering
3. keep vector-first sources where possible
4. create raster fallbacks only when required by the rendering path
5. maintain captions and references in the document text

Suggested layout:

- \`assets/\`
- \`figures/\`
- \`diagrams/\`
- \`assets/manifest.json\`

Load \`document-asset-pipeline\` when figure placement and conversion are part of the task.

## Design palettes

Choose ONE palette and apply consistently.

Selection rule:

- If the user specifies a palette or formatting rules, follow them exactly.
- Otherwise, select the most context-appropriate palette.
  - Academic writing defaults to Academic (paper-ready).
  - Formal reports default to Ink & Zen.
  - Nature/biotech narratives default to Wilderness Oasis.
  - Case studies default to Terra Cotta Afterglow.
  - Technical manuals default to Midnight Code.

- Academic (paper-ready):
  - Title: #0B1220
  - Body: #111827
  - Accent: #1F4E79
  - Table header bg: #1F4E79, text: #FFFFFF
  - Table row alt: #F3F4F6

- Ink & Zen:
  - Title: #0B1220
  - Body: #0F172A
  - Accent: #334155

- Wilderness Oasis:
  - Title: #1A1F16
  - Body: #2D3329
  - Accent: #4B5D3A

- Terra Cotta Afterglow:
  - Title: #26211F
  - Body: #3D3735
  - Accent: #A1563E

- Midnight Code:
  - Title: #020617
  - Body: #1E293B
  - Accent: #2563EB

## Preflight checks (required)

1) Check Python availability.
2) Check required packages:
   - reportlab
   - pypdf
   - pdfplumber

If missing, propose installation commands and wait for approval.

## Output checklist

- Confirm output file paths.
- Include a short summary of transformations.
- Confirm how diagrams, SVGs, and images were converted and placed.
`,
}
