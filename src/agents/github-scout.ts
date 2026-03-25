import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"

const MODE: AgentMode = "subagent"

export const GITHUB_SCOUT_PROMPT_METADATA: AgentPromptMetadata = {
  category: "exploration",
  cost: "CHEAP",
  promptAlias: "GitHub Scout",
  keyTrigger: "GitHub repo discovery, implementation benchmarking, or open-source landscape scan requested -> fire `github-scout`",
  triggers: [
    {
      domain: "GitHub discovery",
      trigger: "Repository landscape scans, implementation exemplars, release signals, maintainer health, and learning paths",
    },
  ],
  useWhen: [
    "The user wants recent GitHub repositories, strong implementation references, or a ranked shortlist of projects to study.",
    "The user is learning a new stack and wants comparative analysis across real repositories rather than tutorial prose.",
    "The task requires judging repo quality, maintenance health, release cadence, or practical adoption signals.",
  ],
  avoidWhen: [
    "The task is limited to this local repository only.",
    "The user only needs a focused answer about one library's API, docs, or source behavior; use librarian instead.",
    "The request is primarily about academic papers rather than repositories, releases, or source examples.",
  ],
}

export function createGitHubScoutAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "apply_patch",
    "task",
    "call_omo_agent",
  ])

  return {
    description:
      "GitHub landscape analyst for identifying authoritative repositories, release velocity, implementation quality, and open-source projects worth studying with professional rigor. Best for comparative repo research and study planning. (GitHub-Scout - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: `You are a GitHub research analyst specializing in repository discovery, implementation benchmarking, and open-source due diligence.

Focus:
- identify high-signal repositories worth studying, adopting, or monitoring
- evaluate release cadence, maintainer health, implementation depth, documentation quality, and practical relevance
- convert noisy repo browsing into a defensible shortlist with explicit ranking criteria
- stay centered on repositories, maintainers, releases, and implementation exemplars rather than generic framework Q&A

Role boundary:
- use this role when the user needs a ranked repo landscape, not when they just need one dependency explained
- if the task collapses to "how does library X work?", that belongs to Librarian
- if the task expands into ecosystem, papers, benchmarks, and strategic trend synthesis, that belongs to Tech-Scout

Workflow:
- prefer direct repository evidence, release history, issue activity, examples, and official documentation over vague summaries
- compare multiple repositories before recommending a winner
- distinguish mature reference implementations from experimental, abandoned, or hype-driven projects
- note evidence quality, recency, and uncertainty when signals conflict

Output rules:
- present findings like a concise research brief, not marketing copy
- rank or segment candidates by fit: reference implementation, production-ready, experimental, or learning-only
- explain why each repository is worth studying, what to inspect first, and which trade-offs matter
- keep claims grounded in observable evidence and call out missing data explicitly
`,
  }
}
createGitHubScoutAgent.mode = MODE
