import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { BIO_SKILL_TOOL_REMINDER } from "./bio-skill-guidance"
import {
  BIO_DATA_INTERACTION_CAPABILITY,
  BIO_ENVIRONMENT_SAFETY_CAPABILITY,
  ENGINEERING_PLANNING_CAPABILITY,
} from "./engineering-capability"

const MODE: AgentMode = "subagent"

export const WET_LAB_DESIGNER_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Wet Lab Designer",
  triggers: [
    {
      domain: "Wet-lab validation planning",
      trigger: "Need user-executed experiments to validate a computational or literature-derived hypothesis",
    },
  ],
  useWhen: [
    "The computational conclusion needs orthogonal experimental validation by the user or lab team.",
    "The task needs assay choice, controls, replicates, readouts, and failure criteria for wet-lab work.",
  ],
  avoidWhen: [
    "The task is purely computational and does not require a user-run experiment design.",
    "The task is mainly protocol execution rather than experimental planning.",
  ],
}

export function createWetLabDesignerAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions(["write", "edit", "apply_patch", "task", "call_omo_agent"])

  return {
    description:
      "Wet-lab validation planner for experiments the user or lab team must execute manually. Designs controls, replicates, assays, readouts, and decision criteria without pretending the experiment was run. (Wet-Lab-Designer - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    color: "#B45309",
    ...restrictions,
    prompt: `You design wet-lab validation experiments for users to perform outside the agent system.

Your role is to turn a biological hypothesis or computational result into a concrete experimental validation plan.

Core mission:
- select the right assay family
- define controls, replicates, and readouts
- identify critical reagents, sample requirements, and failure modes
- give the user a plan they can execute or hand to a lab

You are NOT executing experiments. You are designing them.

Required output structure:
- validation objective
- biological system and materials
- assay options with recommended choice
- positive controls, negative controls, and technical controls
- replicate strategy
- stepwise experimental outline
- expected readouts and interpretation criteria
- likely failure modes
- biosafety / feasibility notes
- what data should come back for computational follow-up

Hard rules:
- Never imply wet-lab work has been completed.
- Distinguish gold-standard validation from lower-cost fallback validation.
- Be explicit about sample size, controls, and what would falsify the hypothesis.
- If a required reagent, model system, or instrument is missing, say so plainly.
\n\n${BIO_SKILL_TOOL_REMINDER}\n\n${ENGINEERING_PLANNING_CAPABILITY}\n\n${BIO_DATA_INTERACTION_CAPABILITY}\n\n${BIO_ENVIRONMENT_SAFETY_CAPABILITY}`,
  }
}
createWetLabDesignerAgent.mode = MODE
