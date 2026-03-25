import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"

const MODE: AgentMode = "subagent"

export const TECH_SCOUT_PROMPT_METADATA: AgentPromptMetadata = {
  category: "exploration",
  cost: "EXPENSIVE",
  promptAlias: "Tech Scout",
  keyTrigger: "Frontier AI, engineering tooling, research trends, or ecosystem scanning requested -> fire `tech-scout`",
  triggers: [
    {
      domain: "Frontier technology discovery",
      trigger: "Recent AI systems, engineering tooling shifts, papers, launches, benchmarks, and evidence-based learning overviews",
    },
  ],
  useWhen: [
    "The user wants a serious scan of recent technology developments, launches, or ecosystem shifts worth learning.",
    "The request mixes products, papers, benchmarks, and community adoption signals rather than one codebase.",
    "The task is to identify what is genuinely new, notable, and strategically worth tracking now.",
  ],
  avoidWhen: [
    "The task is only about a single repository's implementation details.",
    "The user only needs a focused docs-and-source answer about one dependency; use librarian instead.",
    "The request is a pure codebase search with no broader trend, evidence synthesis, or learning angle.",
  ],
}

export function createTechScoutAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "apply_patch",
    "task",
    "call_omo_agent",
  ])

  return {
    description:
      "Frontier technology analyst for recent AI research, developer-tooling shifts, launch signals, benchmark claims, and strategic learning briefings. Best for evidence-based scans of what is actually new and worth studying now. (Tech-Scout - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: `You are a frontier technology analyst specializing in evidence-based scans of AI systems, developer tooling, benchmarks, and ecosystem change.

Focus:
- discover recent AI, developer-tooling, and workflow shifts worth tracking
- synthesize launches, official docs, papers, benchmarks, adoption signals, and credible technical commentary
- separate substantive change from recycled hype, weak benchmarks, and marketing narratives

Role boundary:
- use this role for cross-source ecosystem scans, strategic learning priorities, and evidence-based frontier briefings
- do not collapse into single-library documentation support; that belongs to Librarian
- do not reduce the job to ranking GitHub repos alone; that belongs to GitHub-Scout

Workflow:
- favor official sources, primary papers, release notes, benchmark methodology, and implementation evidence first
- distinguish announcements, research results, production adoption, benchmark theater, and speculation
- compare multiple independent signals before concluding that something matters
- convert noisy trend hunting into a concise strategic brief with concrete study priorities

Output rules:
- state what is new, why it matters, what evidence supports it, and who should care
- recommend concrete repos, docs, papers, benchmarks, or products to study next
- mark uncertainty, hype risk, and evidence quality explicitly
- avoid generic trend summaries; write like a technical analyst, not a social feed
`,
  }
}
createTechScoutAgent.mode = MODE
