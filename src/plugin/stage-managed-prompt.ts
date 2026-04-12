import {
  readRepoBootstrapSelection,
  readLatestCheckpointMetadata,
  readRuntimeWorkflowState,
} from "../features/boulder-state"
import {
  buildAcceptanceRuntimeCapability,
  buildAutonomousCloseoutRuntimeCapability,
  buildExecutionRuntimeCapability,
  buildOrchestrationRuntimeCapability,
} from "../agents/engineering-capability"
import { getAgentConfigKey } from "../shared/agent-display-names"
import {
  buildBootstrapChoicesBlock,
  buildBootstrapModeStickyContext,
} from "./bootstrap-mode"
import { getSessionBootstrapMode } from "../features/claude-code-session-state"
import type { SessionBootstrapSelection } from "../features/claude-code-session-state"

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
  promptMode?: "full-anchor" | "capsule" | "delta"
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

function buildCompactArtifactPolicyContext(input: {
  artifactMode?: string
  artifactRoot?: string
  activeWorkItem?: string
  artifactRationale?: string
}): string | null {
  const { artifactMode, artifactRoot, activeWorkItem, artifactRationale } = input
  if (!artifactMode && !artifactRoot && !activeWorkItem) {
    return null
  }

  const lines = ["[artifact-policy-capsule]"]
  if (artifactMode) lines.push(`- Mode: ${artifactMode}`)
  if (artifactRoot) lines.push(`- Root: \`${artifactRoot}\``)
  if (activeWorkItem) lines.push(`- Active item: ${activeWorkItem}`)
  if (artifactRationale) lines.push(`- Note: ${artifactRationale}`)
  return lines.join("\n")
}

function buildManualBoundaryContext(boundaries: string[] | undefined): string | null {
  if (!boundaries || boundaries.length === 0) return null
  return [
    "[manual-boundaries]",
    "- These items are explicitly owned by the user or require manual external handling.",
    "- Do NOT reopen them as autonomous todos unless the user explicitly hands them back.",
    ...boundaries.map((boundary) => `- ${boundary}`),
  ].join("\n")
}

function buildCompactManualBoundaryContext(boundaries: string[] | undefined): string | null {
  if (!boundaries || boundaries.length === 0) return null
  return [
    "[manual-boundary-capsule]",
    "- User-owned / manual items stay out of the autonomous backlog by default.",
    ...boundaries.map((boundary) => `- ${boundary}`),
  ].join("\n")
}

function buildCompactBootstrapModeContext(selection: SessionBootstrapSelection): string {
  const lines = [
    "[bootstrap-capsule]",
    `- Primary posture: ${selection.primary.labelZh} | ${selection.primary.labelEn}`,
  ]

  if (selection.secondary.length > 0) {
    lines.push(`- Companion modes: ${selection.secondary.map((mode) => mode.key).join(", ")}`)
  }
  if (selection.primary.isCustom && selection.primary.customInstruction) {
    lines.push(`- Custom instruction: ${selection.primary.customInstruction}`)
  }

  return lines.join("\n")
}

function buildTodoGraphContext(
  structuredTodos: Array<{
    content: string
    status: string
    kind: string
    owner: string
  }> | undefined,
): string | null {
  if (!structuredTodos || structuredTodos.length === 0) return null

  const activeTodos = structuredTodos.filter(
    (todo) => todo.status !== "completed" && todo.status !== "cancelled" && todo.status !== "deleted",
  )
  if (activeTodos.length === 0) return null

  return [
    "[todo-graph]",
    "- Structured runtime todo graph for the current wave.",
    "- Prefer this classification over ad-hoc prose when deciding whether work is setup, implementation, verification, review-gate, blocked, or user-owned.",
    ...activeTodos.map((todo) => `- [${todo.status}] (${todo.kind}/${todo.owner}) ${todo.content}`),
  ].join("\n")
}

function buildCompactTodoGraphContext(
  structuredTodos: Array<{
    content: string
    status: string
    kind: string
    owner: string
  }> | undefined,
): string | null {
  if (!structuredTodos || structuredTodos.length === 0) return null

  const activeTodos = structuredTodos
    .filter((todo) => todo.status !== "completed" && todo.status !== "cancelled" && todo.status !== "deleted")
    .slice(0, 5)
  if (activeTodos.length === 0) return null

  return [
    "[todo-graph-capsule]",
    ...activeTodos.map((todo) => `- ${todo.kind}/${todo.owner}: ${todo.content}`),
  ].join("\n")
}

function buildCompactStageCapsule(input: {
  agent: SupportedStageManagedAgent
  stage: StageName
  autoModeLevel: string
  interactionMode: string
  currentWave?: number
  rehydrationReason?: string
  lastCheckpointKind?: string
}): string {
  const lines = [
    "[stage-managed-capsule]",
    `- Agent: ${input.agent}`,
    `- Stage: ${input.stage}`,
    `- Wave: ${String(input.currentWave ?? 1).padStart(3, "0")}`,
    `- Mode: ${input.autoModeLevel} + ${input.interactionMode}`,
  ]

  if (input.agent === "wase") {
    lines.push("- Contract: orchestrate the current wave, keep backlog disciplined, and finish the reviewed batch before inventing a new one.")
  } else if (input.agent === "bio-autopilot" || input.agent === "bio-orchestrator") {
    lines.push("- Contract: keep evidence, inference, and wet-lab proposals separated; execute only the current bio wave before widening scope.")
  } else if (input.agent === "hephaestus") {
    lines.push("- Contract: stay execution-first; do not reload the full autonomous doctrine unless stage posture clearly drifted.")
  } else if (input.agent === "atlas") {
    lines.push("- Contract: keep delegation and review inspectable; do not reopen stale autonomous backlog by default.")
  } else {
    lines.push("- Contract: keep orchestration strong but only for the current stage and wave.")
  }

  if (input.stage === "review") {
    lines.push("- Review rule: accept or reject with concrete findings; do not self-close on vague completion language.")
  } else if (input.stage === "plan") {
    lines.push("- Planning rule: define only the next decisive wave.")
  } else {
    lines.push("- Build rule: execute the current checkpoint and update state after each meaningful verification.")
  }

  if (input.rehydrationReason) {
    lines.push(`- Rehydration reason: ${input.rehydrationReason}`)
  }
  if (input.lastCheckpointKind) {
    lines.push(`- Last checkpoint kind: ${input.lastCheckpointKind}`)
  }

  return lines.join("\n")
}

function buildStageDelta(input: {
  agent: SupportedStageManagedAgent
  stage: StageName
  currentWave?: number
  autoModeLevel: string
  interactionMode: string
  activeWorkItem?: string
}): string {
  const lines = [
    "[stage-managed-delta]",
    `- ${input.agent} :: ${input.stage} :: wave ${String(input.currentWave ?? 1).padStart(3, "0")}`,
    `- Mode: ${input.autoModeLevel} + ${input.interactionMode}`,
  ]

  if (input.stage === "plan") {
    lines.push("- Only shape the next decisive wave.")
  } else if (input.stage === "review") {
    lines.push("- Review with concrete findings and either accept or route the next fix wave.")
  } else {
    lines.push("- Keep executing the current checkpoint and update state after verification.")
  }

  if (input.activeWorkItem) {
    lines.push(`- Active item: ${input.activeWorkItem}`)
  }

  return lines.join("\n")
}

export function buildAutonomousUserDirectiveContext(input: {
  agent: string | undefined
  promptText: string
  guidanceMode?: "initial" | "repeat" | "precommit-revision" | "postcommit-guidance"
  promptChanged?: boolean
  likelyUndoFailed?: boolean
  approvedBatchCarryover?: boolean
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
    if (!input.approvedBatchCarryover) {
      return null
    }
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
      input.approvedBatchCarryover && (input.guidanceMode === undefined || input.guidanceMode === "initial" || input.guidanceMode === "repeat")
        ? "The user started a fresh batch after the previous reviewed wave was already accepted."
        : "The user added new guidance after execution may already have started.",
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

  if (input.approvedBatchCarryover) {
    lines.push("- the prior reviewed batch already passed acceptance, so treat any still-pending todo items from that batch as stale unless the new user request explicitly carries them forward")
  }

  return lines.join("\n")
}

export function buildAutonomousReentryContext(input: {
  agent: string | undefined
}): string | null {
  const agent = toSupportedAgent(input.agent)
  if (!agent || !isAlwaysStageManagedAgent(agent)) {
    return null
  }

  return [
    "[autonomous-reentry]",
    "This session is returning to an autonomous stage-managed agent after a manual non-autonomous takeover.",
    "",
    "Before continuing:",
    "- treat the current runtime workflow files as the canonical recovery source",
    "- reload the current stage and wave before assuming the old autonomous backlog is still valid",
    "- compare the current todo graph against the latest user-visible intent and drop stale pending items aggressively",
    "- if the manual takeover changed priorities, rebuild the next wave instead of resuming the old one blindly",
    "- restart autonomous turn classification from this point instead of inheriting stale pre-takeover turn state",
  ].join("\n")
}

export function buildFreshRepoBootstrapContext(input: {
  agent: string | undefined
  promptText: string
  detectionReason?: string
}): string | null {
  const agent = toSupportedAgent(input.agent)
  if (!agent) return null
  if (agent === "hephaestus") return null

  const promptText = input.promptText.toLowerCase()
  if (
    /flutter|react|next\.?js|vue|plugin|sdk|library|cli|backend|api|bioinformatics|pipeline|rna-?seq|single cell|scrna|dashboard|tauri|electron|service/.test(promptText)
  ) {
    return null
  }

  const lines = [
    "[fresh-repo-bootstrap]",
    "The repository appears to be an initialization-stage repo with no stable engineering system yet.",
    "这个仓库看起来仍处于初始化阶段，当前还没有稳定的工程体系。",
    "",
    "Before starting substantial execution:",
    "在开始实质执行之前：",
    "- ask exactly ONE setup question with the `question` tool",
    "- ask which engineering system or project posture should be established first",
    "- use a fixed preset option list plus one explicit custom/manual-fill option",
    "- allow multi-select: one primary mode plus optional companion modes",
    "- 问题允许多选：先确定一个主模式，再允许补充 1-2 个辅助模式。",
    "- 问清楚这次要按哪种工程体系起步，再开始真正建仓和规划。",
    "",
    "Preset choices / 预设选项：",
  ]
  lines.push(...buildBootstrapChoicesBlock(input.agent))
  lines.push(
    "  8. 自定义工程姿态 | custom project posture",
    "- If the user chooses custom, ask for one concise line describing the desired engineering posture, then continue with that as the first-wave contract.",
    "- 如果用户选择自定义，就让用户补一行“这个仓库要按什么姿态起步”，然后把这行内容当作第一波工程契约。",
    "- If the user chooses AI-designed, derive the repo posture with this scale:",
    "  - repo main type / 仓库主类型",
    "  - primary deliverable / 主交付物",
    "  - execution rhythm / 执行节奏",
    "  - artifact organization / 产物组织方式",
    "  - verification intensity / 验证强度",
    "  - user involvement level / 用户参与强度",
    "  - default question policy / 默认提问策略",
    "- 如果用户选择 AI 自行设计，就先按上面这套量表推导工程姿态，再把推导结果锁成后续常驻规则。",
  )

  lines.push(
    "- do not guess the project posture from the repo name alone",
    "- after the user answers, lock the chosen posture into the first real plan/wave and continue",
    "- once selected, keep that repo posture as a lightweight persistent rule until the user changes it",
  )

  if (input.detectionReason) {
    lines.push(`- bootstrap signal: ${input.detectionReason}`)
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
    buildAutonomousCloseoutRuntimeCapability({
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
      "- If the correct bio category is still unclear, start with `skill(name=\"research/bioinformatics\")`, then load the chosen category guide, then the detailed leaf skill.",
      "- Load only the current-stage skills: `skill(name=\"bio-methods\")` first, execution skills later, visualization only when needed.",
      "- Do not start literature, validation, and visualization branches all at once on the first wave.",
    )
  } else if (input.stage === "build") {
    lines.push(
      "- Execute the current computational wave before broadening the biological story.",
      "- When you need a new modality-specific skill and the category is not obvious, re-enter through `skill(name=\"research/bioinformatics\")` instead of guessing a random leaf skill.",
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
    buildAutonomousCloseoutRuntimeCapability({
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
  const checkpointMetadata = readLatestCheckpointMetadata(input.directory)
  const consumedCheckpointMetadata =
    checkpointMetadata?.consumed_by_session_id === input.sessionID
      ? checkpointMetadata
      : null

  const stage = toStageName(runtimeState?.current_stage ?? consumedCheckpointMetadata?.source_stage ?? "build")
  const autoModeLevel = runtimeState?.auto_mode_level ?? consumedCheckpointMetadata?.source_auto_mode_level ?? "light"
  const interactionMode = runtimeState?.interaction_mode ?? consumedCheckpointMetadata?.source_interaction_mode ?? "batch"
  const checkpointArtifactPolicy =
    runtimeState?.artifact_mode ||
    runtimeState?.artifact_root ||
    runtimeState?.artifact_strategy ||
    runtimeState?.active_work_item
      ? null
      : consumedCheckpointMetadata
  const checkpointBootstrapMode =
    (() => {
      const bootstrapCategory = (agent === "bio-autopilot" || agent === "bio-orchestrator")
        ? "bio" as const
        : "engineering" as const
      if (
        !consumedCheckpointMetadata?.bootstrap_primary_key ||
        !consumedCheckpointMetadata.bootstrap_primary_label_zh ||
        !consumedCheckpointMetadata.bootstrap_primary_label_en
      ) {
        return null
      }

      return {
        category: bootstrapCategory,
        primary: {
          category: bootstrapCategory,
          key: consumedCheckpointMetadata.bootstrap_primary_key,
          labelZh: consumedCheckpointMetadata.bootstrap_primary_label_zh,
          labelEn: consumedCheckpointMetadata.bootstrap_primary_label_en,
          summaryZh: "Recovered from checkpoint metadata.",
          summaryEn: "Recovered from checkpoint metadata.",
          ...(consumedCheckpointMetadata.bootstrap_custom_instruction
            ? { isCustom: true, customInstruction: consumedCheckpointMetadata.bootstrap_custom_instruction }
            : {}),
        },
        secondary: (consumedCheckpointMetadata.bootstrap_secondary_keys ?? []).map((key) => ({
          category: bootstrapCategory,
          key,
          labelZh: key,
          labelEn: key,
          summaryZh: "Recovered companion posture from checkpoint metadata.",
          summaryEn: "Recovered companion posture from checkpoint metadata.",
        })),
      }
    })()
  const bootstrapMode =
    getSessionBootstrapMode(input.sessionID) ??
    readRepoBootstrapSelection(input.directory) ??
    checkpointBootstrapMode
  const artifactPolicyContext = buildArtifactPolicyContext({
    artifactMode: runtimeState?.artifact_mode ?? checkpointArtifactPolicy?.artifact_mode,
    artifactRoot: runtimeState?.artifact_root ?? checkpointArtifactPolicy?.artifact_root,
    artifactStrategy: runtimeState?.artifact_strategy ?? checkpointArtifactPolicy?.artifact_strategy,
    activeWorkItem: runtimeState?.active_work_item ?? checkpointArtifactPolicy?.active_work_item,
    artifactRationale:
      runtimeState?.artifact_rationale ??
      (checkpointArtifactPolicy ? "Recovered from latest checkpoint metadata for this resumed session." : undefined),
  })
  const bootstrapModeContext = bootstrapMode
    ? buildBootstrapModeStickyContext(bootstrapMode)
    : null
  const compactArtifactPolicyContext = buildCompactArtifactPolicyContext({
    artifactMode: runtimeState?.artifact_mode ?? checkpointArtifactPolicy?.artifact_mode,
    artifactRoot: runtimeState?.artifact_root ?? checkpointArtifactPolicy?.artifact_root,
    activeWorkItem: runtimeState?.active_work_item ?? checkpointArtifactPolicy?.active_work_item,
    artifactRationale:
      runtimeState?.artifact_rationale ??
      (checkpointArtifactPolicy ? "Recovered from latest checkpoint metadata for this resumed session." : undefined),
  })
  const compactBootstrapModeContext = bootstrapMode
    ? buildCompactBootstrapModeContext(bootstrapMode)
    : null
  const manualBoundaryContext = buildManualBoundaryContext(runtimeState?.manual_boundaries ?? consumedCheckpointMetadata?.manual_boundaries)
  const compactManualBoundaryContext = buildCompactManualBoundaryContext(runtimeState?.manual_boundaries ?? consumedCheckpointMetadata?.manual_boundaries)
  const todoGraphContext = buildTodoGraphContext(runtimeState?.structured_todos)
  const compactTodoGraphContext = buildCompactTodoGraphContext(runtimeState?.structured_todos)

  if (input.promptMode === "capsule") {
    return [
      buildCompactStageCapsule({
        agent,
        stage,
        autoModeLevel,
        interactionMode,
        currentWave: runtimeState?.current_wave ?? consumedCheckpointMetadata?.source_wave,
        rehydrationReason: runtimeState?.last_rehydration_reason ?? "checkpoint-recovery",
        lastCheckpointKind: runtimeState?.last_checkpoint_kind ?? consumedCheckpointMetadata?.checkpoint_kind,
      }),
      compactArtifactPolicyContext,
      compactBootstrapModeContext,
      compactManualBoundaryContext,
      compactTodoGraphContext,
    ].filter(Boolean).join("\n\n")
  }

  if (input.promptMode === "delta") {
    return [
      buildStageDelta({
        agent,
        stage,
        currentWave: runtimeState?.current_wave ?? consumedCheckpointMetadata?.source_wave,
        autoModeLevel,
        interactionMode,
        activeWorkItem: runtimeState?.active_work_item ?? checkpointArtifactPolicy?.active_work_item,
      }),
      compactArtifactPolicyContext,
      compactManualBoundaryContext,
      compactTodoGraphContext,
    ].filter(Boolean).join("\n\n")
  }

  if (agent === "wase") {
    const block = buildWaseStageBlock({
      stage,
      autoModeLevel,
      interactionMode,
    })
    return [block, artifactPolicyContext, bootstrapModeContext, manualBoundaryContext, todoGraphContext].filter(Boolean).join("\n\n")
  }

  if (agent === "sisyphus" || agent === "hephaestus" || agent === "atlas") {
    const block = buildEngineeringStageBlock({
      agent,
      stage,
      autoModeLevel,
      interactionMode,
    })
    return [block, artifactPolicyContext, bootstrapModeContext, manualBoundaryContext, todoGraphContext].filter(Boolean).join("\n\n")
  }

  const block = buildBioStageBlock({
    agent,
    stage,
    autoModeLevel,
    interactionMode,
  })
  return [block, artifactPolicyContext, bootstrapModeContext, manualBoundaryContext, todoGraphContext].filter(Boolean).join("\n\n")
}
