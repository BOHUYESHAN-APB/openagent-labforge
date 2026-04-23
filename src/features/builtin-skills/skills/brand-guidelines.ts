import type { BuiltinSkill } from "../types"

export const brandGuidelinesSkill: BuiltinSkill = {
  name: "brand-guidelines",
  description:
    "Apply brand voice, typography, color, layout, and consistency rules across documents, decks, pages, and communication outputs",
  metadata: {
    category: "writing/brand-guidelines",
    domain: "brand-guidelines",
  },
  // agent: "article-writer",
  allowedTools: ["Read(*)", "Bash(*)"],
  template: `# Brand Guidelines

Use this skill when output must feel consistent with a product, company, lab, or team identity.

Applicable surfaces:
- landing pages
- dashboards
- reports
- decks
- documents
- announcements
- public-facing or investor-facing material

## Mission

Make the output feel like it belongs to the same system, not like disconnected AI-generated fragments.

## Brand consistency checklist

- voice and tone
- vocabulary and claim posture
- typography choices
- color and emphasis
- diagram and visual language
- naming consistency
- section and hierarchy rhythm

## Working rules

- if the user gives explicit brand constraints, follow them exactly
- if the repo or assets imply an existing identity, infer it before inventing a new one
- if no clear brand system exists, create a restrained working style instead of random decoration
- keep consistency across page, document, and deck outputs
- do not let one flashy section break the rest of the system

## When to load companion skills

- load \`frontend-ui-ux\` for product surfaces and UI-heavy implementation
- load \`doc-coauthoring\` for long-form documents that need structural revision
- load \`internal-comms\` for internal messaging that must match team tone
- load \`docx-workbench\`, \`pdf-toolkit\`, or \`pptx-studio\` when the brand system must be carried into those formats

## Output contract

- inferred or provided brand rules
- typography / color / tone decisions
- consistency risks
- where the rules were applied`,
}
