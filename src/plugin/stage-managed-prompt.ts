import { readRuntimeWorkflowState } from "../features/boulder-state"
import {
  buildAcceptanceRuntimeCapability,
  buildExecutionRuntimeCapability,
  buildOrchestrationRuntimeCapability,
} from "../agents/engineering-capability"
import { getAgentConfigKey } from "../shared/agent-display-names"

type SupportedStageManagedAgent =
  | "wase"
  | "bio-autopilot"
  | "bio-orchestrator"
  | "sisyphus"
  | "hephaestus"
  | "atlas"

type StageManagedPromptInput = {
  directory: string
  sessionID: string
  agent: string | undefined
}

type StageName = "plan" | "build" | "review"

function toSupportedAgent(agent: string | undefined): SupportedStageManagedAgent | null {
  const agentKey = getAgentConfigKey(agent ?? "")
  if (
    agentKey === "wase" ||
    agentKey === "bio-autopilot" ||
    agentKey === "bio-orchestrator" ||
    agentKey === "sisyphus" ||
    agentKey === "hephaestus" ||
    agentKey === "atlas"
  ) {
    return agentKey
  }
  return null
}

function isAlwaysStageManagedAgent(agent: SupportedStageManagedAgent): boolean {
  return agent === "wase" || agent === "bio-autopilot" || agent === "bio-orchestrator"
}

function toStageName(stage: string): StageName {
  if (stage === "plan" || stage === "review") {
    return stage
  }
  return "build"
}

function buildModeHeader(input: {
  agent: SupportedStageManagedAgent
  stage: string
  autoModeLevel: string
  interactionMode: string
}): string {
  return `[stage-managed-prompt]
Agent: ${input.agent}
Stage: ${input.stage}
Auto mode: ${input.autoModeLevel}
Interaction mode: ${input.interactionMode}`
}

function buildWaseStageBlock(input: {
  stage: StageName
  autoModeLevel: string
  interactionMode: string
}): string {
  const lines = [
    buildModeHeader({
      agent: "wase",
      stage: input.stage,
      autoModeLevel: input.autoModeLevel,
      interactionMode: input.interactionMode,
    }),
  ]

  if (input.stage === "plan") {
    lines.push(
      "- Build only the next decisive execution wave.",
      "- Default to 3-6 concrete tasks unless runtime workflow is explicitly heavy.",
      "- Load only the skills needed for the current phase before delegating.",
      "- Use `skill(name=\"backend-architecture\")`, `skill(name=\"frontend-ui-ux\")`, or `skill(name=\"proposal-and-roadmap\")` only when the current phase clearly needs them.",
    )
  } else if (input.stage === "build") {
    lines.push(
      "- Keep exactly one task in progress.",
      "- Prefer direct execution or specialist delegation for the current step only.",
      "- Verify outputs and update the task state immediately after each checkpoint.",
      "- Pull extra skill detail on demand instead of carrying the full skill catalog in context.",
    )
  } else {
    lines.push(
      "- Run acceptance review only after a meaningful implementation wave exists.",
      "- Compare changed scope against the original request and current backlog before concluding.",
      "- If clear unfinished work remains, create the next wave instead of narrating it as prose.",
    )
  }

  if (input.autoModeLevel === "light") {
    lines.push("- Light mode: do not inflate the backlog unnecessarily.")
  } else {
    lines.push("- Heavy mode: expand backlog only when real progress justifies a larger wave.")
  }

  if (input.interactionMode === "batch") {
    lines.push("- Batch mode: finish the current reviewed wave cleanly before inventing another.")
  } else {
    lines.push("- Continuous mode: continue into the next wave when obvious work remains.")
  }

  lines.push(
    buildOrchestrationRuntimeCapability({
      stage: input.stage,
      autoModeLevel: input.autoModeLevel,
      interactionMode: input.interactionMode,
      profile: "wase",
    }),
    buildExecutionRuntimeCapability({
      stage: input.stage,
      autoModeLevel: input.autoModeLevel,
      interactionMode: input.interactionMode,
      profile: "wase",
    }),
    buildAcceptanceRuntimeCapability({
      stage: input.stage,
      autoModeLevel: input.autoModeLevel,
      interactionMode: input.interactionMode,
      profile: "wase",
    }),
  )

  return lines.join("\n\n")
}

function buildBioStageBlock(input: {
  agent: "bio-autopilot" | "bio-orchestrator"
  stage: StageName
  autoModeLevel: string
  interactionMode: string
}): string {
  const lines = [
    buildModeHeader({
      agent: input.agent,
      stage: input.stage,
      autoModeLevel: input.autoModeLevel,
      interactionMode: input.interactionMode,
    }),
  ]

  if (input.stage === "plan") {
    lines.push(
      "- Identify the minimum decisive biological inputs before expanding the work graph.",
      "- Load only the current-stage skills: `skill(name=\"bio-methods\")` first, execution skills later, visualization only when needed.",
      "- Do not start literature, validation, and visualization branches all at once on the first wave.",
    )
  } else if (input.stage === "build") {
    lines.push(
      "- Execute the current computational wave before broadening the biological story.",
      "- Use `skill(name=\"bio-pipeline\")` or `skill(name=\"bio-tools\")` for execution guidance, and add modality-specific skills only when required.",
      "- Keep evidence, inference, and wet-lab proposals separated.",
      "- Perform side validation only when there is a real output worth checking from another angle.",
    )
  } else {
    lines.push(
      "- Acceptance review belongs here, after a meaningful execution checkpoint exists.",
      "- Use `skill(name=\"paper-evidence\")` or `skill(name=\"bio-visualization\")` only if this review stage actually needs them.",
      "- State what is directly supported, what is inferred, and what still needs validation.",
      "- Do not close the session on self-declared completion alone.",
    )
  }

  if (input.autoModeLevel === "light") {
    lines.push("- Light mode: keep the first bio wave tight and reviewable.")
  } else {
    lines.push("- Heavy mode: maintain a multi-wave backlog only after real progress or explicit heavy workflow state.")
  }

  if (input.interactionMode === "batch") {
    lines.push("- Batch mode: finish the current reviewed wave before rolling into another.")
  } else {
    lines.push("- Continuous mode: keep going after review when obvious work still remains.")
  }

  lines.push(
    buildExecutionRuntimeCapability({
      stage: input.stage,
      autoModeLevel: input.autoModeLevel,
      interactionMode: input.interactionMode,
      profile: "bio",
    }),
    buildAcceptanceRuntimeCapability({
      stage: input.stage,
      autoModeLevel: input.autoModeLevel,
      interactionMode: input.interactionMode,
      profile: "bio",
    }),
  )

  if (input.agent === "bio-autopilot") {
    lines.push(
      buildOrchestrationRuntimeCapability({
        stage: input.stage,
        autoModeLevel: input.autoModeLevel,
        interactionMode: input.interactionMode,
        profile: "bio",
      }),
    )
  }

  return lines.join("\n\n")
}

function buildEngineeringStageBlock(input: {
  agent: "sisyphus" | "hephaestus" | "atlas"
  stage: StageName
  autoModeLevel: string
  interactionMode: string
}): string {
  const lines = [
    buildModeHeader({
      agent: input.agent,
      stage: input.stage,
      autoModeLevel: input.autoModeLevel,
      interactionMode: input.interactionMode,
    }),
  ]

  if (input.agent === "sisyphus") {
    lines.push(
      "- Runtime workflow detected: keep orchestration strong, but reload only the current-stage engineering detail into context.",
      buildOrchestrationRuntimeCapability({
        stage: input.stage,
        autoModeLevel: input.autoModeLevel,
        interactionMode: input.interactionMode,
      }),
      buildExecutionRuntimeCapability({
        stage: input.stage,
        autoModeLevel: input.autoModeLevel,
        interactionMode: input.interactionMode,
      }),
      buildAcceptanceRuntimeCapability({
        stage: input.stage,
        autoModeLevel: input.autoModeLevel,
        interactionMode: input.interactionMode,
      }),
    )
  } else if (input.agent === "hephaestus") {
    lines.push(
      "- Runtime workflow detected: stay execution-first and avoid carrying full autonomous detail in every turn.",
      buildExecutionRuntimeCapability({
        stage: input.stage,
        autoModeLevel: input.autoModeLevel,
        interactionMode: input.interactionMode,
      }),
      buildAcceptanceRuntimeCapability({
        stage: input.stage,
        autoModeLevel: input.autoModeLevel,
        interactionMode: input.interactionMode,
      }),
    )
  } else {
    lines.push(
      "- Runtime workflow detected: keep the orchestration graph inspectable and reload only the active-stage delegation standards.",
      buildOrchestrationRuntimeCapability({
        stage: input.stage,
        autoModeLevel: input.autoModeLevel,
        interactionMode: input.interactionMode,
      }),
      buildAcceptanceRuntimeCapability({
        stage: input.stage,
        autoModeLevel: input.autoModeLevel,
        interactionMode: input.interactionMode,
      }),
    )
  }

  return lines.join("\n\n")
}

export function buildStageManagedPromptContext(
  input: StageManagedPromptInput,
): string | null {
  const agent = toSupportedAgent(input.agent)
  if (!agent) return null

  const runtimeState = readRuntimeWorkflowState(input.directory, input.sessionID)
  if (!runtimeState && !isAlwaysStageManagedAgent(agent)) {
    return null
  }

  const stage = toStageName(runtimeState?.current_stage ?? "build")
  const autoModeLevel = runtimeState?.auto_mode_level ?? "light"
  const interactionMode = runtimeState?.interaction_mode ?? "batch"

  if (agent === "wase") {
    return buildWaseStageBlock({
      stage,
      autoModeLevel,
      interactionMode,
    })
  }

  if (agent === "sisyphus" || agent === "hephaestus" || agent === "atlas") {
    return buildEngineeringStageBlock({
      agent,
      stage,
      autoModeLevel,
      interactionMode,
    })
  }

  return buildBioStageBlock({
    agent,
    stage,
    autoModeLevel,
    interactionMode,
  })
}
