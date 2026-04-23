import type { BuiltinSkill } from "../types"

export const internalCommsSkill: BuiltinSkill = {
  name: "internal-comms",
  description:
    "Internal communication writing for project updates, leadership summaries, change notices, FAQs, incident notes, and cross-team alignment docs",
  metadata: {
    category: "writing/internal-comms",
    domain: "internal-communications",
  },
  // agent: "article-writer",
  allowedTools: ["Read(*)", "Bash(*)"],
  template: `# Internal Comms

Use this skill when writing:
- project updates
- internal announcements
- leadership summaries
- team status notes
- incident or change communication
- FAQs for internal rollout

## Mission

Write internal communication that is clear, honest, structured, and easy to act on.

## Required structure

Always make these things obvious:
- what changed
- why it matters
- who is affected
- what action is required
- what remains uncertain
- where to ask follow-up questions

## Audience handling

- leadership: high signal, risk, impact, decisions needed
- implementation teams: concrete next steps, dependencies, owners, timing
- broad internal audience: plain language, scope, expected behavior changes

## Writing rules

- prefer direct statements over hype
- surface risk and uncertainty instead of burying them
- distinguish shipped, in-progress, blocked, and proposed work
- avoid vague corporate filler unless backed by concrete action
- keep updates skimmable with clear sectioning

## Useful formats

- progress / plans / problems
- what changed / impact / next steps
- summary / details / risks / asks
- incident summary / mitigation / current status / follow-up

## When to load companion skills

- load \`proposal-and-roadmap\` when the update includes long-horizon plans
- load \`brand-guidelines\` when the message must match a defined organizational voice
- load \`doc-coauthoring\` when the communication is becoming a large collaborative document

## Output contract

- audience
- communication type
- required action
- risk and uncertainty
- concise message draft`,
}
