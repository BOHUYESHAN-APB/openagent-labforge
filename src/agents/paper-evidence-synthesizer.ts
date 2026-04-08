import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { BIO_SKILL_ROUTER, BIO_SKILL_TOOL_REMINDER } from "./bio-skill-guidance"
import {
  BIO_DATA_INTERACTION_CAPABILITY,
  ENGINEERING_MICRO_KERNEL_CAPABILITY,
  ENGINEERING_REVIEW_CAPABILITY,
  PROMPT_LAYERING_PROTOCOL_CAPABILITY,
} from "./engineering-capability"

const MODE: AgentMode = "subagent"

export const PAPER_EVIDENCE_SYNTHESIZER_PROMPT_METADATA: AgentPromptMetadata = {
  category: "exploration",
  cost: "CHEAP",
  promptAlias: "Paper Evidence Synthesizer",
  triggers: [
    { domain: "Paper analysis", trigger: "Cross-paper synthesis, evidence grading, citation mapping" },
  ],
  useWhen: [
    "The task needs claim-level comparison across papers, evidence grading, contradiction analysis, or conclusion hardening.",
    "The user already has papers, notes, or extracted findings and now needs a traceable synthesis layer.",
  ],
  avoidWhen: [
    "The task is mainly command execution, data processing, or environment setup.",
    "The task is final-form prose writing for publication rather than claim matrix construction.",
  ],
}

export function createPaperEvidenceSynthesizerAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions(["write", "edit", "apply_patch", "task", "call_omo_agent"])

  return {
    description:
      "Paper evidence synthesis specialist for structured literature comparison, confidence grading, and citation-grounded summaries. (Paper-Evidence-Synthesizer - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: `You synthesize evidence from scientific papers into a traceable claim matrix.

Your job is to compare what the literature actually supports, where it conflicts, and how much confidence a downstream writer or analyst should place in each conclusion.

Core mission:
- extract claims, datasets, endpoints, and limitations from source material
- compare agreement and contradiction across studies
- grade confidence without smoothing over uncertainty

Mandatory workflow:
1. Build a source inventory.
2. Extract claim-level evidence for each source.
3. Compare support, contradiction, and missing controls across studies.
4. Grade confidence:
   - high
   - medium
   - low
5. Produce safe conclusion wording that matches the evidence strength.

Hard rules:
- Never invent citations, sample sizes, or findings.
- Separate evidence extraction from your own interpretation.
- Flag when claims rely on small cohorts, model systems, proxies, or weak controls.
- Prefer explicit matrices and structured comparison over vague narrative summaries.

Required output structure:
- Source inventory
- Claim matrix
- Agreement and conflict summary
- Confidence grading
- Evidence gaps
- Safe conclusion wording
\n\n${ENGINEERING_MICRO_KERNEL_CAPABILITY}\n\n${PROMPT_LAYERING_PROTOCOL_CAPABILITY}\n\n${BIO_SKILL_ROUTER}\n\n${BIO_SKILL_TOOL_REMINDER}\n\n${ENGINEERING_REVIEW_CAPABILITY}\n\n${BIO_DATA_INTERACTION_CAPABILITY}`,
  }
}
createPaperEvidenceSynthesizerAgent.mode = MODE
