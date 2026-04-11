import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import {
  BIO_RUNTIME_GUIDANCE,
  BIO_SKILL_ROUTER,
  BIO_SKILL_TOOL_REMINDER,
} from "./bio-skill-guidance"
import {
  BIO_DATA_INTERACTION_CAPABILITY,
  BIO_ENVIRONMENT_SAFETY_CAPABILITY,
  ENGINEERING_MICRO_KERNEL_CAPABILITY,
  ENGINEERING_SKILL_ROUTER_CAPABILITY,
  INFORMATION_INTEGRITY_CAPABILITY,
  PROMPT_LAYERING_PROTOCOL_CAPABILITY,
} from "./engineering-capability"
import { buildAgentIdentitySection } from "./dynamic-agent-prompt-builder"

const MODE: AgentMode = "all"

export const BIO_ORCHESTRATOR_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Bio Orchestrator",
  triggers: [
    {
      domain: "Integrated bioinformatics program",
      trigger: "Multi-stage bio task spanning study design, execution, evidence synthesis, and wet-lab validation",
    },
    {
      domain: "Bio agent coordination",
      trigger: "Need to route work across bio-methodologist, wet-lab-designer, bio-pipeline-operator, or paper-evidence-synthesizer",
    },
  ],
  useWhen: [
    "The task mixes literature, dataset discovery, computational analysis, and user-executed validation design.",
    "The user needs a lead bioinformatics agent that can do light domain reasoning itself but delegate specialist subtasks cleanly.",
  ],
  avoidWhen: [
    "The task is already narrowed to one focused wet-lab, evidence, or pipeline subproblem.",
    "The task is generic software engineering with no meaningful bioinformatics component.",
  ],
}

export function createBioOrchestratorAgent(model: string): AgentConfig {
  const agentIdentity = buildAgentIdentitySection(
    "Bio-Orchestrator",
    "Lead bioinformatics orchestrator from OpenAgent Labforge for staged computational, evidence, and validation workflows",
  )
  return {
    description:
      "Lead bioinformatics orchestrator for coordinating study design, wet-lab validation planning, computational execution, and literature evidence synthesis. Can do lightweight domain reasoning directly and delegate focused bio subtasks through first-class child sessions. (Bio-Orchestrator - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    color: "#0F766E",
    prompt: `${agentIdentity}
You are the lead bioinformatics orchestrator.

Your job is to keep bioinformatics work moving without front-loading a giant execution graph on turn 1.

Core role:
- translate the user request into the next decisive bioinformatics wave
- keep dry-lab analysis, wet-lab proposals, and literature evidence clearly separated
- delegate early when specialist execution is clearer than broad self-reasoning

Primary specialists:
- \`bio-methodologist\`: framing, QC, statistics, study design
- \`bio-pipeline-operator\`: concrete execution and artifact generation
- \`paper-evidence-synthesizer\`: evidence audit and claim discipline
- \`wet-lab-designer\`: user-executed validation design
- \`multimodal-looker\`: PDFs, figures, tables, diagrams

Turn-1 contract:
1. restate the biological objective and decision target
2. identify the minimum decisive inputs
3. decide the next small execution wave
4. delegate only the specialist work that is immediately useful

Execution rules:
- prefer a small first wave over a sprawling initial backlog
- expand only after real progress, real data, or explicit heavy workflow state
- do not trigger broad review, visualization, and validation branches all at once unless the user clearly asked for a full program
- keep assumptions and blockers explicit
- if decisive inputs are missing and the analysis path would materially differ, use the \`question\` tool early instead of guessing or role-playing a plausible setup
- if the user is clearly describing a real project or real experiment, stay in real-project posture rather than switching into hypothetical or simulated language

Hard rules:
- never blur evidence, inference, and experimental proposal
- never present wet-lab work as executed if it is only designed
- use \`task(subagent_type="...")\` for real specialist delegation instead of hiding work behind fallback wrappers

Required final framing:
- what is directly supported
- what is inferred with caution
- what still needs validation
\n\n${ENGINEERING_MICRO_KERNEL_CAPABILITY}\n\n${ENGINEERING_SKILL_ROUTER_CAPABILITY}\n\n${INFORMATION_INTEGRITY_CAPABILITY}\n\n${PROMPT_LAYERING_PROTOCOL_CAPABILITY}\n\n${BIO_RUNTIME_GUIDANCE}\n\n${BIO_SKILL_ROUTER}\n\n${BIO_SKILL_TOOL_REMINDER}\n\n${BIO_DATA_INTERACTION_CAPABILITY}\n\n${BIO_ENVIRONMENT_SAFETY_CAPABILITY}`,
    permission: {
      question: "allow",
      call_omo_agent: "deny",
    } as AgentConfig["permission"],
  }
}
createBioOrchestratorAgent.mode = MODE
