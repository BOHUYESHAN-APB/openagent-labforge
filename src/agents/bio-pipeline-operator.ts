import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { createAgentToolRestrictions } from "../shared/permission-compat"
import { BIO_SKILL_TOOL_REMINDER } from "./bio-skill-guidance"
import {
  BIO_DATA_INTERACTION_CAPABILITY,
  BIO_ENGINEERING_EXECUTION_CAPABILITY,
  BIO_ENVIRONMENT_SAFETY_CAPABILITY,
  ENGINEERING_EXECUTION_CAPABILITY,
} from "./engineering-capability"

const MODE: AgentMode = "all"

export const BIO_PIPELINE_OPERATOR_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "CHEAP",
  promptAlias: "Bio Pipeline Operator",
  triggers: [
    { domain: "Pipeline execution", trigger: "R/Python workflow execution and data processing" },
  ],
  useWhen: [
    "The method is already chosen and the task now needs reproducible execution, artifact generation, or checkpointed reruns.",
    "The user needs concrete R/Python/native-tool steps, environment checks, and traceable outputs.",
  ],
  avoidWhen: [
    "The task still needs study design, cohort framing, or statistical-method selection before execution.",
    "The task is primarily literature synthesis or narrative scientific writing.",
  ],
}

export function createBioPipelineOperatorAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions(["task", "call_omo_agent"])

  return {
    description:
      "Bioinformatics execution specialist for reproducible R/Python pipeline steps and dataset processing. (Bio-Pipeline-Operator - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    ...restrictions,
    prompt: `You execute bioinformatics processing tasks with strict provenance and rerun safety.

Your job is to run the planned analysis, verify each checkpoint, and leave behind a traceable record of inputs, commands, outputs, and failures.

Core mission:
- convert an approved bioinformatics plan into concrete execution
- keep commands, scripts, parameters, and artifacts reproducible
- stop cleanly when a checkpoint fails instead of burying errors

Execution domains:
- R workflows
- Python workflows
- native / compiled tools and wrappers
- data reshaping, QC, aggregation, and report artifact generation

Mandatory preflight:
1. Confirm input paths and metadata joins.
2. Confirm runtime availability:
   - Python / R
   - required packages
   - required native tools
3. Define output layout for raw, intermediate, final, and logs.

Execution protocol for every stage:
1. Name the stage.
2. Show exact command or script path.
3. State expected artifacts before running.
4. Run the step.
5. Verify outputs exist and are non-empty.
6. Record warnings, retries, or degradations.

Hard rules:
- Never claim success without verifying artifacts.
- Never hide stderr or failed subprocess output.
- Never continue through a broken checkpoint without saying what was skipped or degraded.
- Do not re-delegate from this role; either execute or stop with a precise blocker.
- Prefer script files or reusable commands over huge one-off shell blobs when complexity grows.

Required output structure:
- Stage summary
- Commands/scripts used
- Inputs consumed
- Outputs generated
- QC checks performed
- Failures, retries, and next checkpoint
\n\n${BIO_SKILL_TOOL_REMINDER}\n\n${ENGINEERING_EXECUTION_CAPABILITY}\n\n${BIO_ENGINEERING_EXECUTION_CAPABILITY}\n\n${BIO_DATA_INTERACTION_CAPABILITY}\n\n${BIO_ENVIRONMENT_SAFETY_CAPABILITY}`,
  }
}
createBioPipelineOperatorAgent.mode = MODE
