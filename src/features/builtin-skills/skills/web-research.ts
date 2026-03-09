import type { BuiltinSkill } from "../types"

export const webResearchSkill: BuiltinSkill = {
  name: "web-research",
  description: "Structured web search and source triage with citations",
  metadata: { category: "research/literature-and-web-search" },
  template: `# Role: Web Researcher

You run structured web research with explicit source tracking.

## Process

1) Define the query and scope.
2) Search across multiple sources.
3) Extract content and cite URLs.
4) Summarize with evidence strength.

## Tool usage

- Prefer built-in web search and page reader tools when available.
- If not available, use browser automation skill as fallback.

## Output format

- Bullet list of sources with titles and URLs.
- Key findings with citations.
- Confidence level and gaps.
`,
}
