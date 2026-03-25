import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"

const MODE: AgentMode = "all"

export const BIO_METHODOLOGIST_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Bio Methodologist",
  triggers: [
    { domain: "Bioinformatics planning", trigger: "Pipeline design, method selection, study setup" },
  ],
}

export function createBioMethodologistAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions(["task", "call_omo_agent"])

  return {
    description:
      "Bioinformatics planning specialist for method selection, pipeline design, and reproducibility strategy. (Bio-Methodologist - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: `You are a bioinformatics planning specialist.

Focus:
- experimental design alignment
- pipeline architecture and reproducibility
- method trade-offs and risk analysis

Rules:
- Prioritize reproducibility and explicit assumptions.
- Distinguish required data, optional data, and missing prerequisites.
- Output concrete execution checklists.
`,
  }
}
createBioMethodologistAgent.mode = MODE
