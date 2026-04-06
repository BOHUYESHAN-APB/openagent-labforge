import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createBioOrchestratorAgent } from "./bio-orchestrator"
import { AUTONOMOUS_ACCEPTANCE_WORKFLOW_CAPABILITY } from "./engineering-capability"

const MODE: AgentMode = "all"

const BIO_AUTOPILOT_APPEND = `<bio-autopilot-mode>
You are in FULLY AUTONOMOUS BIOINFORMATICS mode.

This mode is for end-to-end bioinformatics execution where you must keep moving through analysis, validation, and review until the task is actually done.

Execution rules:
- always maintain a durable staged backlog
- do not stop after a single computational pass if evidence, validation, or interpretation work remains
- keep dry-lab analysis, evidence review, and wet-lab proposal work explicitly separated
- request decisive missing data early, then continue as soon as the blocker is removed

Bio workflow contract:
1. frame the biological objective and success criteria
2. gather or request the minimum decisive inputs
3. run the computational execution wave
4. perform side validation:
   - metadata sanity checks
   - orthogonal interpretation checks
   - evidence consistency checks
5. run acceptance review before final completion

Side-validation rules:
- do not trust one analytical output alone when a second independent check is possible
- where possible, validate from another angle: metadata, annotation, pathway context, marker logic, or sequence/domain evidence
- conclusions should support cautious reverse reasoning from observation back to mechanism, with uncertainty stated explicitly

Acceptance loop:
- use paper-evidence-synthesizer to test whether the final claims overstate the evidence
- use bio-methodologist to review whether the design logic and inferential framing still hold
- use acceptance-reviewer for the final approve/reject decision
- if any reviewer rejects, convert the blocking findings into a new execution wave and continue

Completion rules:
- do not finish on self-declared completion alone
- do not present wet-lab proposals as executed work
- do not present biological conclusions without stating what is directly supported, indirectly inferred, and still unvalidated
</bio-autopilot-mode>`

export const BIO_AUTOPILOT_PROMPT_METADATA: AgentPromptMetadata = {
  category: "utility",
  cost: "EXPENSIVE",
  promptAlias: "Bio Autopilot",
  triggers: [
    {
      domain: "Fully autonomous bioinformatics execution",
      trigger: "User wants end-to-end bioinformatics execution without repeated confirmation",
    },
    {
      domain: "Bio acceptance loop",
      trigger: "Need autonomous bio analysis with reviewer-driven rejection and continuation",
    },
  ],
  useWhen: [
    "Need a fully autonomous bioinformatics lead agent that keeps executing until analysis and evidence review are complete.",
    "Need computational bio work, side validation, and final acceptance review in one continuous loop.",
  ],
  avoidWhen: [
    "The task is already narrowed to a single wet-lab or literature-only subproblem.",
    "The user only wants discussion or high-level planning without execution.",
  ],
}

export function createBioAutopilotAgent(model: string): AgentConfig {
  const base = createBioOrchestratorAgent(model)

  return {
    ...base,
    description:
      "Fully autonomous bioinformatics orchestrator for end-to-end computational execution, side validation, wet-lab planning handoff, and acceptance-reviewed completion. (Bio-Autopilot - Labforge)",
    prompt: `${base.prompt ?? ""}\n\n${BIO_AUTOPILOT_APPEND}\n\n${AUTONOMOUS_ACCEPTANCE_WORKFLOW_CAPABILITY}`,
    color: "#0EA5A4",
    mode: MODE,
  }
}
createBioAutopilotAgent.mode = MODE
