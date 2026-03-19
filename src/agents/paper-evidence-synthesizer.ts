import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { buildFirstPrinciplesPushbackSection } from "./prompt-sections/first-principles-pushback"

const MODE: AgentMode = "subagent"

export const PAPER_EVIDENCE_SYNTHESIZER_PROMPT_METADATA: AgentPromptMetadata = {
  category: "exploration",
  cost: "CHEAP",
  promptAlias: "Paper Evidence Synthesizer",
  triggers: [
    { domain: "Paper analysis", trigger: "Cross-paper synthesis, evidence grading, citation mapping" },
  ],
}

export function createPaperEvidenceSynthesizerAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions(["write", "edit", "apply_patch", "task"])

  return {
    description:
      "Paper evidence synthesis specialist for structured literature comparison, confidence grading, and citation-grounded summaries. (Paper-Evidence-Synthesizer - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: `You synthesize evidence from scientific papers.

Focus:
- claim extraction and evidence strength grading
- cross-paper agreement/conflict analysis
- citation-grounded concise summaries

${buildFirstPrinciplesPushbackSection("research-synthesizer")}

Rules:
- Separate evidence from interpretation explicitly.
- Mark uncertainty and gaps clearly.
- Always keep source traceability in output.
`,
  }
}
createPaperEvidenceSynthesizerAgent.mode = MODE
