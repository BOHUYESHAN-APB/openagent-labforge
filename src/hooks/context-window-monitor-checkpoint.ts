import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import {
  getRuntimeWorkflowPaths,
  markRuntimeWorkflowCheckpoint,
  readRuntimeWorkflowState,
} from "../features/boulder-state"
import { writeFileAtomically, writeJSONAtomically } from "../shared/write-file-atomically"
import { log } from "../shared/logger"

type CompressionProfile = "engineering" | "bio"

type AutoCompressionCheckpointArgs = {
  directory: string
  sessionID: string
  level: number
  profile: CompressionProfile
  totalInputTokens: number
  cacheReadTokens: number
  contextLimit: number
  invocation?: "automatic" | "manual"
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

type CheckpointRetentionConfig = {
  global_keep_count?: number
  per_session_keep_count?: number
  session_expiry_days?: number
  auto_cleanup?: boolean
}

function getCheckpointVersion(checkpointRoot: string): number {
  const historyDir = join(checkpointRoot, "history")
  if (!existsSync(historyDir)) return 1

  try {
    const files = readdirSync(historyDir)
    const versions = files
      .filter((f) => f.startsWith("checkpoint-") && f.endsWith(".md"))
      .map((f) => {
        const match = f.match(/checkpoint-(\d+)\.md/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((v) => v > 0)

    return versions.length > 0 ? Math.max(...versions) + 1 : 1
  } catch {
    return 1
  }
}

function cleanupOldCheckpoints(
  checkpointRoot: string,
  config: CheckpointRetentionConfig,
): void {
  const globalKeepCount = config.global_keep_count ?? 5
  const perSessionKeepCount = config.per_session_keep_count ?? 3
  const sessionExpiryDays = config.session_expiry_days ?? 0
  const autoCleanup = config.auto_cleanup ?? false

  // Skip cleanup if disabled
  if (!autoCleanup) {
    return
  }

  // Cleanup global history
  if (globalKeepCount > 0) {
    const historyDir = join(checkpointRoot, "history")
    if (existsSync(historyDir)) {
      try {
        const files = readdirSync(historyDir)
          .filter((f) => f.startsWith("checkpoint-") && f.endsWith(".md"))
          .map((f) => ({
            name: f,
            path: join(historyDir, f),
            mtime: statSync(join(historyDir, f)).mtime.getTime(),
          }))
          .sort((a, b) => b.mtime - a.mtime)

        // Keep only the most recent N checkpoints
        const toDelete = files.slice(globalKeepCount)
        for (const file of toDelete) {
          try {
            rmSync(file.path, { force: true })
            log("[checkpoint-cleanup] Removed old global checkpoint: " + file.name)
          } catch (error) {
            log("[checkpoint-cleanup] Failed to remove global checkpoint: " + file.name + " " + String(error))
          }
        }
      } catch (error) {
        log("[checkpoint-cleanup] Failed to cleanup global history: " + String(error))
      }
    }
  }

  // Cleanup per-session checkpoints
  const bySessionRoot = join(checkpointRoot, "by-session")
  if (!existsSync(bySessionRoot)) return

  try {
    const sessionDirs = readdirSync(bySessionRoot)
    const now = Date.now()
    const expiryMs = sessionExpiryDays * 24 * 60 * 60 * 1000

    for (const sessionDir of sessionDirs) {
      const sessionPath = join(bySessionRoot, sessionDir)
      if (!statSync(sessionPath).isDirectory()) continue

      // Check if session directory is expired
      if (sessionExpiryDays > 0 && expiryMs > 0) {
        const sessionMtime = statSync(sessionPath).mtime.getTime()
        if (now - sessionMtime > expiryMs) {
          try {
            rmSync(sessionPath, { recursive: true, force: true })
            log("[checkpoint-cleanup] Removed expired session directory: " + sessionDir)
            continue
          } catch (error) {
            log("[checkpoint-cleanup] Failed to remove expired session: " + sessionDir + " " + String(error))
          }
        }
      }

      // Cleanup old checkpoints within session
      if (perSessionKeepCount > 0) {
        try {
          const files = readdirSync(sessionPath)
            .filter((f) => f.startsWith("checkpoint-") && f.endsWith(".md"))
            .map((f) => ({
              name: f,
              path: join(sessionPath, f),
              mtime: statSync(join(sessionPath, f)).mtime.getTime(),
            }))
            .sort((a, b) => b.mtime - a.mtime)

          const toDelete = files.slice(perSessionKeepCount)
          for (const file of toDelete) {
            try {
              rmSync(file.path, { force: true })
              log("[checkpoint-cleanup] Removed old session checkpoint: " + sessionDir + " " + file.name)
            } catch (error) {
              log("[checkpoint-cleanup] Failed to remove session checkpoint: " + file.name + " " + String(error))
            }
          }
        } catch (error) {
          log("[checkpoint-cleanup] Failed to cleanup session checkpoints: " + sessionDir + " " + String(error))
        }
      }
    }
  } catch (error) {
    log("[checkpoint-cleanup] Failed to cleanup by-session directory: " + String(error))
  }
}

export function writeAutoCompressionCheckpoint(
  args: AutoCompressionCheckpointArgs,
  retentionConfig?: CheckpointRetentionConfig,
): {
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
    invocation = "automatic",
  } = args
  const checkpointRoot = join(directory, ".opencode", "openagent-labforge", "checkpoints")
  const autoRoot = join(checkpointRoot, "auto")

  // Get next version number
  const version = getCheckpointVersion(autoRoot)
  const versionedFilename = `checkpoint-${String(version).padStart(3, "0")}.md`

  // Paths for versioned checkpoints
  const historyDir = join(autoRoot, "history")
  const historyPath = join(historyDir, versionedFilename)

  // Paths for latest (for backward compatibility)
  const markdownPath = join(autoRoot, "latest.md")
  const metadataPath = join(autoRoot, "latest.meta.json")

  // Paths for by-session versioned checkpoints
  const bySessionDir = join(autoRoot, "by-session", sessionID)
  const bySessionPath = join(bySessionDir, versionedFilename)

  const state = readRuntimeWorkflowState(directory, sessionID)
  const paths = getRuntimeWorkflowPaths(directory, sessionID)
  const contextCapsulePath = join(paths.rootDir, "context-capsule.md")
  const stageCapsule = readTextIfExists(paths.stageCapsuleFile)
  const stageAnchor = readTextIfExists(paths.stageAnchorFile)
  const contextCapsule = readTextIfExists(contextCapsulePath)
  const checkpointKind = level >= 3 ? "heavy" : "light"
  const checkpointScope = level >= 3 ? "cross-session" : "same-session"
  const sessionSwitchRecommendation = level >= 3 ? "recommend-switch" : "stay"
  const userConfirmationRequired = level >= 3 && invocation === "automatic"

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
    `- Checkpoint Version: ${version}`,
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
    checkpoint_version: version,
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
    user_confirmation_required: userConfirmationRequired,
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

  // Write versioned checkpoint to history
  ensureParent(historyPath)
  writeFileAtomically(historyPath, markdown, "utf-8")

  // Write versioned checkpoint to by-session
  ensureParent(bySessionPath)
  writeFileAtomically(bySessionPath, markdown, "utf-8")

  // Write latest.md (for backward compatibility)
  writeFileAtomically(markdownPath, markdown, "utf-8")
  writeJSONAtomically(metadataPath, metadata)

  // Cleanup old checkpoints if configured
  cleanupOldCheckpoints(autoRoot, retentionConfig ?? {})

  log("[checkpoint] Wrote checkpoint version " + String(version) + " for session " + sessionID)

  return { markdownPath, metadataPath }
}
