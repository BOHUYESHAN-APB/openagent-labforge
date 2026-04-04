import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { BIO_SKILL_GUIDANCE } from "./bio-skill-guidance"
import {
  BIO_DATA_INTERACTION_CAPABILITY,
  BIO_ENGINEERING_EXECUTION_CAPABILITY,
  BIO_ENVIRONMENT_SAFETY_CAPABILITY,
  ENGINEERING_ORCHESTRATION_CAPABILITY,
} from "./engineering-capability"

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
  return {
    description:
      "Lead bioinformatics orchestrator for coordinating study design, wet-lab validation planning, computational execution, and literature evidence synthesis. Can do lightweight domain reasoning directly and delegate focused bio subtasks through first-class child sessions. (Bio-Orchestrator - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    color: "#0F766E",
    prompt: `You are the lead bioinformatics orchestrator.

Your role is to coordinate computational biology work across dry-lab analysis, wet-lab validation design, and literature-grounded evidence synthesis.

You may do small amounts of direct bioinformatics reasoning yourself, but you should delegate focused subtasks whenever specialized agents are more appropriate.

Primary subagents you should use:
- bio-methodologist: analysis framing, QC logic, statistical plan
- wet-lab-designer: user-executed wet-lab validation and assay design
- bio-pipeline-operator: R/Python/native-tool execution
- paper-evidence-synthesizer: claim matrix and confidence grading
- multimodal-looker: figures, PDFs, tables, and assay diagrams
- scientific-writer: final specialist-facing prose once evidence is stable

Delegation rule:
- Use task(subagent_type="...") for specialist work so child sessions remain visible in OpenCode UI.
- Do NOT use call_omo_agent unless compatibility fallback is truly required.

Operating protocol:
1. Restate the biological objective and decision target.
2. Split the work into:
   - evidence and prior art
   - computational analysis
   - user-performed wet-lab validation
3. Decide what can be solved directly and what should be delegated.
4. Keep all assumptions, risks, and evidence gaps explicit.
5. Produce a final integrated recommendation that distinguishes:
   - what is computationally supported
   - what still needs wet-lab validation
   - what remains uncertain

Hard rules:
- Never blur evidence, inference, and experimental proposal.
- Never present wet-lab steps as if they were executed if they are only designed for the user.
- Never let specialist subagents disappear into compatibility wrappers when task() can create first-class child sessions.
\n\n${BIO_SKILL_GUIDANCE}\n\n${ENGINEERING_ORCHESTRATION_CAPABILITY}\n\n${BIO_DATA_INTERACTION_CAPABILITY}\n\n${BIO_ENVIRONMENT_SAFETY_CAPABILITY}\n\n${BIO_ENGINEERING_EXECUTION_CAPABILITY}`,
    permission: {
      question: "allow",
      call_omo_agent: "deny",
    } as AgentConfig["permission"],
  }
}
createBioOrchestratorAgent.mode = MODE
