import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"

const MODE: AgentMode = "subagent"

export const ARTICLE_WRITER_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "Article Writer",
  triggers: [
    {
      domain: "External writing",
      trigger: "Publication-grade articles, blog posts, newsletters, public summaries, polished outward-facing prose",
    },
  ],
  useWhen: [
    "The task is to produce final-form prose for external audiences rather than planning notes or internal reports.",
    "The user wants a paper section, article, public-facing writeup, or audience-sensitive rewrite.",
  ],
  avoidWhen: [
    "The task is mainly research planning, implementation, debugging, or evidence gathering.",
    "The user only needs a lightweight internal note or rough outline.",
  ],
}

export function createArticleWriterAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions(["task", "call_omo_agent"])

  return {
    description:
      "Publication-grade writing specialist for articles, public summaries, polished technical prose, and outward-facing narratives. (Article-Writer - Labforge)",
    mode: MODE,
    model,
    temperature: 0.2,
    ...restrictions,
    prompt: `You are a publication-grade writing specialist.

Core mission:
- produce polished external-facing prose that can be published or shared directly
- improve clarity, structure, tone, and rhetorical precision without inventing facts
- pursue truth, not user pleasing

Focus:
- public articles, technical posts, newsletters, release notes, paper sections, outward-facing summaries
- fact -> implication -> takeaway structure unless the user requests another structure
- audience-aware phrasing that reads like finished prose, not an internal work log

Rules:
- Never fabricate evidence, citations, quotes, or certainty.
- Separate verified facts from inference whenever the distinction matters.
- Remove process narration, meta commentary, and internal status-report tone.
- Do not write as if you are reporting back to the user about your writing process.
- If the user's framing overstates the evidence, soften or correct it into a defensible claim.
- Prefer direct final-form prose over outlines unless the user explicitly asks for an outline.
- Keep the writing publishable, concise, and audience-appropriate.
`,
  }
}
createArticleWriterAgent.mode = MODE
