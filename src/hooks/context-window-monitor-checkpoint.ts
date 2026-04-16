import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import {
  getRuntimeWorkflowPaths,
  markRuntimeWorkflowCheckpoint,
  readRuntimeWorkflowState,
} from "../features/boulder-state"

type CompressionProfile = "engineering" | "bio"

type AutoCompressionCheckpointArgs = {
  directory: string
  sessionID: string
  level: number
  profile: CompressionProfile
  totalInputTokens: number
  cacheReadTokens: number
  contextLimit: number
}

function formatCompactTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return String(tokens)
}

function readTextIfExists(path: string): string {
  if (!existsSync(path)) return ""
  try {
    return readFileSync(path, "utf-8").trim()
  } catch {
    return ""
  }
}

function ensureParent(path: string): void {
  const parent = dirname(path)
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true })
  }
}

export function writeAutoCompressionCheckpoint(args: AutoCompressionCheckpointArgs): {
  markdownPath: string
  metadataPath: string
} {
  const {
    directory,
    sessionID,
    level,
    profile,
    totalInputTokens,
    cacheReadTokens,
    contextLimit,
  } = args
  const checkpointRoot = join(directory, ".opencode", "openagent-labforge", "checkpoints")
  const autoRoot = join(checkpointRoot, "auto")
  const markdownPath = join(autoRoot, "latest.md")
  const bySessionPath = join(autoRoot, "by-session", `${sessionID}.md`)
  const metadataPath = join(autoRoot, "latest.meta.json")
  const state = readRuntimeWorkflowState(directory, sessionID)
  const paths = getRuntimeWorkflowPaths(directory, sessionID)
  const contextCapsulePath = join(paths.rootDir, "context-capsule.md")
  const stageCapsule = readTextIfExists(paths.stageCapsuleFile)
  const stageAnchor = readTextIfExists(paths.stageAnchorFile)
  const contextCapsule = readTextIfExists(contextCapsulePath)
  const checkpointKind = level >= 3 ? "heavy" : "light"
  const checkpointScope = level >= 3 ? "cross-session" : "same-session"
  const sessionSwitchRecommendation = level >= 3 ? "recommend-switch" : "ask-user"

  markRuntimeWorkflowCheckpoint({
    directory,
    sessionId: sessionID,
    checkpointKind,
    checkpointScope,
    sessionSwitchRecommendation,
  })

  const createdAt = new Date().toISOString()
  const usagePercent = ((totalInputTokens / contextLimit) * 100).toFixed(1)
  const goal = state?.active_work_item ??
    (profile === "bio"
      ? "Continue the current bioinformatics checkpoint without reopening the full compressed session."
      : "Continue the current engineering checkpoint without reopening the full compressed session.")
  const resumeHint = `Continue from checkpoint file .opencode/openagent-labforge/checkpoints/auto/latest.md. Finish the current ${profile === "bio" ? "bioinformatics" : "engineering"} checkpoint first.`

  const markdown = [
    "AUTO COMPRESSION CHECKPOINT",
    "===========================",
    "",
    "SOURCE SESSION",
    "--------------",
    `- Session ID: ${sessionID}`,
    `- Created At: ${createdAt}`,
    `- Checkpoint Kind: ${checkpointKind}`,
    `- Checkpoint Scope: ${checkpointScope}`,
    `- Profile: ${profile}`,
    "",
    "CONTEXT PRESSURE",
    "----------------",
    `- Carried tokens: ${formatCompactTokens(totalInputTokens)} / ${formatCompactTokens(contextLimit)} (${usagePercent}%)`,
    `- Cache read tokens: ${formatCompactTokens(cacheReadTokens)}`,
    `- Compression level: L${level}`,
    "",
    "GOAL",
    "----",
    goal,
    "",
    "CURRENT STATE",
    "-------------",
    state
      ? [
          `- Stage: ${state.current_stage}`,
          `- Wave: ${String(state.current_wave ?? 1).padStart(3, "0")}`,
          `- Auto mode: ${state.auto_mode_level ?? "light"}`,
          `- Interaction mode: ${state.interaction_mode ?? "batch"}`,
          ...(state.artifact_root ? [`- Artifact root: ${state.artifact_root}`] : []),
          ...(state.active_work_item ? [`- Active work item: ${state.active_work_item}`] : []),
        ].join("\n")
      : "- No runtime workflow state existed before compression; use the stage capsule below as the recovery anchor.",
    "",
    "STAGE CAPSULE",
    "-------------",
    stageCapsule || "- No stage capsule was available.",
    "",
    "CONTEXT CAPSULE",
    "--------------",
    contextCapsule || "- No context capsule was available.",
    "",
    "STAGE ANCHOR DIGEST",
    "-------------------",
    stageAnchor ? stageAnchor.slice(0, 4000) : "- No stage anchor was available.",
    "",
    "RESUME INSTRUCTIONS",
    "-------------------",
    "- Do not reopen the full old chat history.",
    "- Load this checkpoint and only the referenced runtime files needed for the next wave.",
    "- Rebuild a fresh todo/task list from the active checkpoint.",
    "- If the task needs a new major branch, ask the user before continuing in this session.",
    "",
  ].join("\n")

  const metadata = {
    handoff_mission: goal,
    source_session_id: sessionID,
    created_at: createdAt,
    goal,
    cwd: directory,
    key_files: [
      ".opencode/openagent-labforge/checkpoints/auto/latest.md",
      ".opencode/openagent-labforge/runtime/" + sessionID + "/context-capsule.md",
      ".opencode/openagent-labforge/runtime/" + sessionID + "/stage-capsule.md",
      ".opencode/openagent-labforge/runtime/" + sessionID + "/context-pressure.json",
    ],
    resume_hint: resumeHint,
    status: "pending",
    consumed_by_session_id: null,
    artifact_mode: state?.artifact_mode ?? "",
    artifact_root: state?.artifact_root ?? "",
    artifact_strategy: state?.artifact_strategy ?? "",
    active_work_item: state?.active_work_item ?? "",
    checkpoint_kind: checkpointKind,
    checkpoint_scope: checkpointScope,
    session_switch_recommendation: sessionSwitchRecommendation,
    user_confirmation_required: true,
    source_stage: state?.current_stage ?? "build",
    source_wave: state?.current_wave ?? 1,
    source_auto_mode_level: state?.auto_mode_level ?? "light",
    source_interaction_mode: state?.interaction_mode ?? "batch",
    stage_anchor_epoch: state?.stage_anchor_epoch ?? 1,
    stage_anchor_hash: state?.stage_anchor_hash ?? "",
    stage_anchor_file: ".opencode/openagent-labforge/runtime/" + sessionID + "/stage-anchor.md",
    stage_capsule_file: ".opencode/openagent-labforge/runtime/" + sessionID + "/stage-capsule.md",
    context_capsule_file: ".opencode/openagent-labforge/runtime/" + sessionID + "/context-capsule.md",
    compression_profile: profile,
    carried_tokens: totalInputTokens,
    cache_read_tokens: cacheReadTokens,
    context_limit: contextLimit,
    compression_level: level,
  }

  ensureParent(markdownPath)
  writeFileSync(markdownPath, markdown, "utf-8")
  ensureParent(bySessionPath)
  writeFileSync(bySessionPath, markdown, "utf-8")
  ensureParent(metadataPath)
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8")

  return { markdownPath, metadataPath }
}
