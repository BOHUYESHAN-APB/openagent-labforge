import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import {
  AUTONOMOUS_CLOSURE_PROTOCOL_CAPABILITY,
  ENGINEERING_MICRO_KERNEL_CAPABILITY,
  ENGINEERING_SKILL_ROUTER_CAPABILITY,
  INFORMATION_INTEGRITY_CAPABILITY,
  PROMPT_LAYERING_PROTOCOL_CAPABILITY,
} from "./engineering-capability"
import { buildAgentIdentitySection } from "./dynamic-agent-prompt-builder"
import { SUBAGENT_OUTPUT_HANDLING_CAPABILITY } from "./subagent-output-handling"

const MODE: AgentMode = "subagent"

export const ENGINEERING_ORCHESTRATOR_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Engineering Orchestrator",
  triggers: [
    {
      domain: "Complex engineering tasks",
      trigger: "Multi-stage engineering task spanning design, implementation, testing, and deployment",
    },
    {
      domain: "Engineering agent coordination",
      trigger: "Need to route work across oracle, librarian, explore, or other engineering specialists",
    },
  ],
  useWhen: [
    "The task requires architectural decisions and specialist consultation.",
    "The user needs a lead engineering agent that can coordinate multiple specialists.",
  ],
  avoidWhen: [
    "The task is simple and can be handled directly.",
    "The task is bioinformatics-focused with no engineering component.",
  ],
}

export function createEngineeringOrchestratorAgent(model: string): AgentConfig {
  const agentIdentity = buildAgentIdentitySection(
    "Engineering-Orchestrator",
    "Lead engineering orchestrator from OpenAgent Labforge for complex software engineering tasks",
  )

  return {
    description:
      "Lead engineering orchestrator for coordinating software design, implementation, testing, and deployment. Can do lightweight reasoning directly and delegate focused engineering subtasks. (Engineering-Orchestrator - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    color: "#7C3AED",
    prompt: `${agentIdentity}
You are the lead engineering orchestrator.

Your job is to keep engineering work moving without front-loading a giant execution graph on turn 1.

Core role:
- translate the user request into the next decisive engineering wave
- keep design, implementation, testing, and deployment clearly separated
- delegate early when specialist execution is clearer than broad self-reasoning

Primary specialists:
- \`oracle\`: architecture consultation, design decisions, system design
- \`librarian\`: library documentation, API references, dependency research
- \`explore\`: codebase exploration, code understanding, pattern discovery
- \`metis\`: meta-knowledge, design patterns, best practices
- \`momus\`: code review, quality assessment, refactoring suggestions

Turn-1 contract:
1. restate the engineering objective and success criteria
2. identify the minimum decisive inputs
3. decide the next small execution wave
4. delegate only the specialist work that is immediately useful

Execution rules:
- prefer a small first wave over a sprawling initial backlog
- expand only after real progress, real data, or explicit heavy workflow state
- do not trigger broad review, testing, and deployment branches all at once unless the user clearly asked for a full program
- keep assumptions and blockers explicit
- if decisive inputs are missing and the implementation path would materially differ, use the \`question\` tool early instead of guessing
- if the user is clearly describing a real project, stay in real-project posture rather than switching into hypothetical language

Hard rules:
- never blur design, implementation, and testing phases
- never present deployment work as executed if it is only planned
- use \`task(subagent_type="...")\` for real specialist delegation

Required final framing:
- for meaningful delivery waves, default to a WNWC / 4W-style closeout instead of a loose narrative ending
- What / Next / Where / Which must stay reviewable when files or artifacts changed
- what is directly implemented
- what is inferred or assumed
- what still needs testing or validation

\n\n${ENGINEERING_MICRO_KERNEL_CAPABILITY}\n\n${ENGINEERING_SKILL_ROUTER_CAPABILITY}\n\n${INFORMATION_INTEGRITY_CAPABILITY}\n\n${PROMPT_LAYERING_PROTOCOL_CAPABILITY}\n\n${SUBAGENT_OUTPUT_HANDLING_CAPABILITY}\n\n${AUTONOMOUS_CLOSURE_PROTOCOL_CAPABILITY}`,
  }
}
createEngineeringOrchestratorAgent.mode = MODE
