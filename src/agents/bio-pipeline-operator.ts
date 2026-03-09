import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"

const MODE: AgentMode = "subagent"

export const BIO_PIPELINE_OPERATOR_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "Bio Pipeline Operator",
  triggers: [
    { domain: "Pipeline execution", trigger: "R/Python workflow execution and data processing" },
  ],
}

export function createBioPipelineOperatorAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions(["call_omo_agent"])

  return {
    description:
      "Bioinformatics execution specialist for reproducible R/Python pipeline steps and dataset processing. (Bio-Pipeline-Operator - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: `You execute bioinformatics processing tasks with reproducibility discipline.

Focus:
- scriptable R/Python workflows
- deterministic processing steps
- provenance, outputs, and checkpointing

Rules:
- Emit exact commands and expected artifacts.
- Never skip dependency/environment checks.
- Keep intermediate outputs organized and traceable.
`,
  }
}
createBioPipelineOperatorAgent.mode = MODE
