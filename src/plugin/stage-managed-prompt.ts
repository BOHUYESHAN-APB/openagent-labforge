import {
  readLatestCheckpointMetadata,
  readRuntimeWorkflowState,
} from "../features/boulder-state"
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

function buildArtifactPolicyContext(input: {
  artifactMode?: string
  artifactRoot?: string
  artifactStrategy?: string
  activeWorkItem?: string
  artifactRationale?: string
}): string | null {
  const {
    artifactMode,
    artifactRoot,
    artifactStrategy,
    activeWorkItem,
    artifactRationale,
  } = input

  if (!artifactMode && !artifactRoot && !artifactStrategy && !activeWorkItem) {
    return null
  }

  const lines = ["[artifact-policy-reload]"]

  if (artifactMode) {
    lines.push(`- Artifact mode: ${artifactMode}`)
  }
  if (artifactRoot) {
    lines.push(`- Artifact root: \`${artifactRoot}\``)
  }
  if (activeWorkItem) {
    lines.push(`- Active work item: ${activeWorkItem}`)
  }

  if (artifactMode === "patch-existing") {
    lines.push("- Default behavior: patch the existing target files before creating new sibling outputs.")
  } else if (artifactMode === "single-doc-rollup") {
    lines.push("- Default behavior: update the main document and index first, then add only the minimum supporting side artifacts.")
  } else if (artifactMode === "package-bundle") {
    lines.push("- Default behavior: stay inside the current package root and active item before opening a new top-level numbered deliverable.")
  }

  if (artifactStrategy === "update-existing-first") {
    lines.push("- Strategy: prefer rolling updates to the current package/index instead of starting a fresh top-level wave.")
  } else if (artifactStrategy === "append-supporting-artifacts") {
    lines.push("- Strategy: add only the scripts, tables, figures, or notes required by the active item.")
  } else if (artifactStrategy === "spawn-new-top-level-item") {
    lines.push("- Strategy: open a new top-level deliverable only after the current item is exhausted or the user explicitly asks for a new module.")
  }

  lines.push("- Token discipline: do not reread large package readmes or broad output trees if this compact policy already identifies the active root and work item.")

  if (artifactRationale) {
    lines.push(`- Rationale: ${artifactRationale}`)
  }

  return lines.join("\n")
}

export function buildAutonomousUserDirectiveContext(input: {
  agent: string | undefined
  promptText: string
  guidanceMode?: "initial" | "repeat" | "precommit-revision" | "postcommit-guidance"
  promptChanged?: boolean
  likelyUndoFailed?: boolean
}): string | null {
  const agent = toSupportedAgent(input.agent)
  if (!agent || !isAlwaysStageManagedAgent(agent)) {
    return null
  }

  const promptText = input.promptText.trim()
  if (!promptText) return null
  if (promptText.includes("<command-instruction>")) return null
  if (
    input.guidanceMode === undefined ||
    input.guidanceMode === "initial" ||
    input.guidanceMode === "repeat"
  ) {
    return null
  }

  const lines = [
    "[autonomous-user-update]",
  ]

  if (input.guidanceMode === "precommit-revision") {
    lines.push(
      "The latest user message revises the immediately previous request before a stable execution wave was committed.",
      "",
      "Before continuing:",
      "- treat any plan, todo sketch, or early internal draft from the prior user turn as provisional",
      "- reuse valid pieces, but let the latest user message override the previous draft wherever they conflict",
      "- if scope was narrowed, patch or replace the first wave before expanding the backlog",
      "- do not hard-commit the first todo draft just because it was started first",
    )

    if (input.likelyUndoFailed) {
      lines.push("- the session appears to have been busy, so interpret this as a delayed corrective override rather than a side comment")
    }
  } else {
    lines.push(
      "The user added new guidance after execution may already have started.",
      "",
      "Before continuing:",
      "- compare the new user guidance against the current todo list and runtime workflow memory",
      "- update, drop, or reorder stale todo items immediately if priorities or scope changed",
      "- preserve already valid completed work, but rewrite pending backlog items that no longer match the latest user intent",
      "- if the new input narrows scope, shrink the current wave instead of blindly continuing the old backlog",
      "- if the new input expands scope, create the next concrete wave before resuming execution",
      "- do not spend multiple turns following an outdated plan after fresh user guidance",
    )
  }

  if (input.promptChanged === false) {
    lines.push("- the new message mostly repeats the previous request, so avoid duplicating todos or restarting completed work unnecessarily")
  }

  return lines.join("\n")
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
  const checkpointMetadata =
    runtimeState?.artifact_mode ||
    runtimeState?.artifact_root ||
    runtimeState?.artifact_strategy ||
    runtimeState?.active_work_item
      ? null
      : readLatestCheckpointMetadata(input.directory)
  const checkpointArtifactPolicy =
    checkpointMetadata?.consumed_by_session_id === input.sessionID
      ? checkpointMetadata
      : null
  const artifactPolicyContext = buildArtifactPolicyContext({
    artifactMode: runtimeState?.artifact_mode ?? checkpointArtifactPolicy?.artifact_mode,
    artifactRoot: runtimeState?.artifact_root ?? checkpointArtifactPolicy?.artifact_root,
    artifactStrategy: runtimeState?.artifact_strategy ?? checkpointArtifactPolicy?.artifact_strategy,
    activeWorkItem: runtimeState?.active_work_item ?? checkpointArtifactPolicy?.active_work_item,
    artifactRationale:
      runtimeState?.artifact_rationale ??
      (checkpointArtifactPolicy ? "Recovered from latest checkpoint metadata for this resumed session." : undefined),
  })

  if (agent === "wase") {
    const block = buildWaseStageBlock({
      stage,
      autoModeLevel,
      interactionMode,
    })
    return artifactPolicyContext ? `${block}\n\n${artifactPolicyContext}` : block
  }

  if (agent === "sisyphus" || agent === "hephaestus" || agent === "atlas") {
    const block = buildEngineeringStageBlock({
      agent,
      stage,
      autoModeLevel,
      interactionMode,
    })
    return artifactPolicyContext ? `${block}\n\n${artifactPolicyContext}` : block
  }

  const block = buildBioStageBlock({
    agent,
    stage,
    autoModeLevel,
    interactionMode,
  })
  return artifactPolicyContext ? `${block}\n\n${artifactPolicyContext}` : block
}
