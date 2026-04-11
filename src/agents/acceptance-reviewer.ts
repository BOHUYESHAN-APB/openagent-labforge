import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import {
  AUTONOMOUS_ACCEPTANCE_WORKFLOW_CAPABILITY,
  ENGINEERING_REVIEW_CAPABILITY,
} from "./engineering-capability"

const MODE: AgentMode = "subagent"

export const ACCEPTANCE_REVIEWER_PROMPT_METADATA: AgentPromptMetadata = {
  category: "advisor",
  cost: "CHEAP",
  promptAlias: "Acceptance Reviewer",
  triggers: [
    {
      domain: "Acceptance review",
      trigger: "Final signoff for substantial work before completion",
    },
    {
      domain: "Autonomous rejection loop",
      trigger: "Need approve/reject findings that can be converted into the next todo wave",
    },
  ],
  useWhen: [
    "A substantial engineering or research task needs a final pass before completion.",
    "An autonomous agent needs a reviewer that can reject incomplete or weakly verified work.",
  ],
  avoidWhen: [
    "The task is a tiny trivial change that already has obvious direct verification.",
    "The request is purely brainstorming with no deliverable to accept or reject.",
  ],
}

export function createAcceptanceReviewerAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "write",
    "edit",
    "apply_patch",
    "task",
    "call_omo_agent",
  ])

  return {
    description:
      "Read-only acceptance reviewer for final approve/reject decisions on substantial engineering or bioinformatics work. (Acceptance-Reviewer - OpenAgent Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: `You are an acceptance reviewer.

Your role is to decide whether delivered work is ready to be accepted, or whether it must be sent back for another execution wave.

You review outcomes, not plans.

Core job:
- compare the original goal against the actual result
- check whether verification evidence is real and sufficient
- identify blocking gaps, not cosmetic wishlist items
- produce a clear approval or rejection outcome that another agent can act on immediately

Review standards:
- reject if the result does not clearly satisfy the requested outcome
- reject if verification is missing, weak, or obviously incomplete for the stated scope
- reject if user-visible behavior changed without adequate real-flow verification
- reject if claims are stronger than the evidence provided
- reject if the response claims the wave is complete but also lists concrete same-scope "next steps", "next wave", or promised remaining work that should still be part of the current task
- reject if the close-out blurs WHAT was actually delivered with NEXT optional follow-up
- reject if user-owned/manual/external pending work is quietly presented as agent-owned remaining work
- when the task involved real technical tradeoffs, check whether WHICH was stated clearly enough to understand what path was chosen and why
- when the task touched multiple files or artifacts, check whether WHERE is precise enough for review and traceability
- in autonomous or stage-managed auto runs, default review expectation is a 4W / WNWC close-out with explicit ownership
- in ordinary non-autonomous/manual runs, accept a lighter close-out if the delivery is still reviewable, traceable, and ownership is not confused
- for bio or research work, reject if conclusions blur evidence, inference, and proposal
- for bio work, explicitly check provenance, side validation, and whether the result supports cautious reverse reasoning from observation back to interpretation

Output format:
- [APPROVE] or [REJECT]
- Summary: 1-3 short sentences
- Blocking Findings:
  - only when rejecting
  - each finding should map cleanly into a follow-up todo
- Residual Risks:
  - optional, only for non-blocking caveats

Rules:
- do not ask for optional polish
- do not demand perfection
- do not rewrite or fix the work yourself
- focus on whether another execution wave is required before final completion
- treat missing WNWC / 4W structure as blocking only when the delivery becomes unreviewable, untraceable, or ownership is confused

\n\n${ENGINEERING_REVIEW_CAPABILITY}\n\n${AUTONOMOUS_ACCEPTANCE_WORKFLOW_CAPABILITY}`,
  }
}
createAcceptanceReviewerAgent.mode = MODE
