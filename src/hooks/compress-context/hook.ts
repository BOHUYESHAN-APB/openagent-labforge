import type { PluginInput } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { OhMyOpenCodeConfig } from "../../config"
import { getSessionAgent } from "../../features/claude-code-session-state"
import { readRuntimeWorkflowState } from "../../features/boulder-state"
import { getAgentConfigKey } from "../../shared/agent-display-names"
import { log } from "../../shared/logger"
import { getSessionModel } from "../../shared/session-model-state"
import { writeAutoCompressionCheckpoint } from "../context-window-monitor-checkpoint"
import { resolveCompactionModel } from "../shared/compaction-model-resolver"

export const HOOK_NAME = "compress-context" as const

type CompressionMode = "status" | "auto" | "l1" | "l2" | "l3"

type CompressionSnapshot = {
  carried_tokens: number
  cache_read_tokens: number
  context_limit: number
  usage_ratio: number
  level: number
  removed_tokens: number
  removed_messages: number
  compacted_tool_outputs: number
  updated_at: string
}

type CompressionResult = {
  requestedMode: CompressionMode
  appliedMode: Exclude<CompressionMode, "auto">
  profile: "engineering" | "bio"
  nativeSummarize: "not-requested" | "requested" | "failed"
  summarizeError?: string
  carriedTokens?: number
  cacheReadTokens?: number
  contextLimit?: number
  usageRatio?: number
  removedTokens?: number
  removedMessages?: number
  compactedToolOutputs?: number
  files: string[]
  checkpointPath?: string
  note: string
}

const COMPRESS_CONTEXT_MARKER = "You are handling a manual context compression command."
const BIO_AGENT_KEYS = new Set([
  "bio-autopilot",
  "bio-orchestrator",
  "bio-methodologist",
  "bio-pipeline-operator",
  "paper-evidence-synthesizer",
  "wet-lab-designer",
])

function extractPromptText(parts: Array<{ type?: string; text?: string }>): string {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("\n")
    .trim()
}

function isCompressContextCommandPrompt(promptText: string): boolean {
  return promptText.includes("<command-instruction>") && promptText.includes(COMPRESS_CONTEXT_MARKER)
}

function extractUserRequest(promptText: string): string {
  const match = promptText.match(/<user-request>\s*([\s\S]*?)\s*<\/user-request>/i)
  return match?.[1]?.trim() ?? ""
}

function normalizeRequestedMode(raw: string): CompressionMode {
  const value = raw.trim().toLowerCase()
  if (value === "l1" || value === "l2" || value === "l3" || value === "status") return value
  return "auto"
}

function getCompressionStatePath(directory: string, sessionID: string): string {
  return join(directory, ".opencode", "openagent-labforge", "runtime", sessionID, "context-pressure.json")
}

function getRuntimeCapsulePath(directory: string, sessionID: string): string {
  return join(directory, ".opencode", "openagent-labforge", "runtime", sessionID, "context-capsule.md")
}

function formatCompactTokens(tokens: number | undefined): string {
  if (tokens === undefined) return "unknown"
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return String(tokens)
}

function inferProfile(agentName: string | undefined): "engineering" | "bio" {
  return BIO_AGENT_KEYS.has(getAgentConfigKey(agentName ?? "")) ? "bio" : "engineering"
}

function readCompressionSnapshot(directory: string, sessionID: string): CompressionSnapshot | null {
  const path = getCompressionStatePath(directory, sessionID)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as CompressionSnapshot
  } catch {
    return null
  }
}

function ensureParent(path: string): void {
  const parent = dirname(path)
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true })
  }
}

function writeLocalContextCapsule(args: {
  directory: string
  sessionID: string
  providerID?: string
  modelID?: string
  totalInputTokens?: number
  cacheReadTokens?: number
  limit?: number
  level: number
}): void {
  const path = getRuntimeCapsulePath(args.directory, args.sessionID)
  const ratio =
    args.totalInputTokens !== undefined && args.limit !== undefined && args.limit > 0
      ? args.totalInputTokens / args.limit
      : undefined
  const content = [
    "# Labforge Context Capsule",
    "",
    `- Session: \`${args.sessionID}\``,
    `- Provider/model: \`${args.providerID ?? "unknown"}/${args.modelID ?? "unknown"}\``,
    `- Context carried: \`${formatCompactTokens(args.totalInputTokens)} / ${formatCompactTokens(args.limit)}${ratio !== undefined ? ` (${(ratio * 100).toFixed(1)}%)` : ""}\``,
    `- Cache read: \`${formatCompactTokens(args.cacheReadTokens)}\``,
    `- Compression level: \`${args.level}\``,
    "- Manual compression command refreshed this capsule.",
    "",
  ].join("\n")

  ensureParent(path)
  writeFileSync(path, content, "utf-8")
}

function writeCompressionSnapshot(args: {
  directory: string
  sessionID: string
  providerID?: string
  modelID?: string
  totalInputTokens?: number
  cacheReadTokens?: number
  limit?: number
  level: number
  snapshot?: CompressionSnapshot | null
}): void {
  const path = getCompressionStatePath(args.directory, args.sessionID)
  const payload = {
    session_id: args.sessionID,
    provider_id: args.providerID ?? "",
    model_id: args.modelID ?? "",
    carried_tokens: args.totalInputTokens ?? args.snapshot?.carried_tokens ?? 0,
    cache_read_tokens: args.cacheReadTokens ?? args.snapshot?.cache_read_tokens ?? 0,
    context_limit: args.limit ?? args.snapshot?.context_limit ?? 0,
    usage_ratio:
      args.totalInputTokens !== undefined && args.limit !== undefined && args.limit > 0
        ? Number((args.totalInputTokens / args.limit).toFixed(4))
        : (args.snapshot?.usage_ratio ?? 0),
    level: args.level,
    removed_tokens: args.snapshot?.removed_tokens ?? 0,
    removed_messages: args.snapshot?.removed_messages ?? 0,
    compacted_tool_outputs: args.snapshot?.compacted_tool_outputs ?? 0,
    updated_at: new Date().toISOString(),
  }

  ensureParent(path)
  writeFileSync(path, JSON.stringify(payload, null, 2), "utf-8")
}

function chooseAppliedMode(snapshot: CompressionSnapshot | null): Exclude<CompressionMode, "auto"> {
  if (!snapshot) return "l1"
  if (snapshot.carried_tokens >= 550_000 || snapshot.level >= 3) return "l3"
  if (snapshot.level >= 2 || snapshot.carried_tokens >= 320_000) return "l2"
  return "l1"
}

function buildCompressionResultPrompt(result: CompressionResult): string {
  const lines = [
    "<system-reminder>",
    "Compression command already executed by the plugin runtime.",
    "Do NOT simulate compression again. Report only the concrete result below.",
    "",
    "## Compression Result",
    `- Requested mode: ${result.requestedMode}`,
    `- Applied mode: ${result.appliedMode}`,
    `- Profile: ${result.profile}`,
    `- Native summarize: ${result.nativeSummarize}`,
    ...(result.summarizeError ? [`- Native summarize error: ${result.summarizeError}`] : []),
    `- Context before: ${formatCompactTokens(result.carriedTokens)} / ${formatCompactTokens(result.contextLimit)}`,
    `- Cache read: ${formatCompactTokens(result.cacheReadTokens)}`,
    ...(result.usageRatio !== undefined ? [`- Usage ratio: ${(result.usageRatio * 100).toFixed(1)}%`] : []),
    `- Micro-pruned: ${formatCompactTokens(result.removedTokens)} stale, ${result.removedMessages ?? 0} messages, ${result.compactedToolOutputs ?? 0} tool outputs`,
    `- Files updated: ${result.files.join(", ")}`,
    ...(result.checkpointPath ? [`- Auto checkpoint: ${result.checkpointPath}`] : ["- Auto checkpoint: none"]),
    `- Note: ${result.note}`,
    "",
    "## Command Split",
    "- `/ol-compress-context` manages operational compression for the current session.",
    "- `/ol-checkpoint` writes an explicit durable handoff artifact for later recovery or cross-session continuation.",
    "- Do not tell the user these two commands are the same.",
    "</system-reminder>",
    "",
    "Reply concisely with the result and the practical next recommendation only.",
  ]

  return lines.join("\n")
}

export function createCompressContextHook(
  ctx: PluginInput,
  pluginConfig: OhMyOpenCodeConfig,
) {
  return {
    "chat.message": async (
      input: { sessionID: string; agent?: string; model?: { providerID: string; modelID: string } },
      output: { parts: Array<{ type?: string; text?: string }> },
    ): Promise<void> => {
      const promptText = extractPromptText(output.parts)
      if (!isCompressContextCommandPrompt(promptText)) return

      const requestedMode = normalizeRequestedMode(extractUserRequest(promptText))
      const snapshot = readCompressionSnapshot(ctx.directory, input.sessionID)
      const appliedMode = requestedMode === "auto" ? chooseAppliedMode(snapshot) : requestedMode
      const currentAgent = input.agent ?? getSessionAgent(input.sessionID)
      const profile = inferProfile(currentAgent)
      const currentModel = input.model ?? getSessionModel(input.sessionID)
      const contextLimit = snapshot?.context_limit
      const carriedTokens = snapshot?.carried_tokens
      const cacheReadTokens = snapshot?.cache_read_tokens
      const files = [
        `.opencode/openagent-labforge/runtime/${input.sessionID}/context-capsule.md`,
        `.opencode/openagent-labforge/runtime/${input.sessionID}/context-pressure.json`,
      ]

      writeLocalContextCapsule({
        directory: ctx.directory,
        sessionID: input.sessionID,
        providerID: currentModel?.providerID,
        modelID: currentModel?.modelID,
        totalInputTokens: carriedTokens,
        cacheReadTokens,
        limit: contextLimit,
        level: appliedMode === "l3" ? 3 : appliedMode === "l2" ? 2 : 1,
      })
      writeCompressionSnapshot({
        directory: ctx.directory,
        sessionID: input.sessionID,
        providerID: currentModel?.providerID,
        modelID: currentModel?.modelID,
        totalInputTokens: carriedTokens,
        cacheReadTokens,
        limit: contextLimit,
        level: appliedMode === "l3" ? 3 : appliedMode === "l2" ? 2 : 1,
        snapshot,
      })

      let checkpointPath: string | undefined
      if (appliedMode === "l2" || appliedMode === "l3") {
        const checkpoint = writeAutoCompressionCheckpoint({
          directory: ctx.directory,
          sessionID: input.sessionID,
          level: appliedMode === "l3" ? 3 : 2,
          profile,
          totalInputTokens: carriedTokens ?? 0,
          cacheReadTokens: cacheReadTokens ?? 0,
          contextLimit: contextLimit ?? 0,
          invocation: "manual",
        })
        checkpointPath = ".opencode/openagent-labforge/checkpoints/auto/latest.md"
        files.push(checkpoint.markdownPath.includes("auto/latest.md") ? checkpointPath : checkpoint.markdownPath)
      }

      let nativeSummarize: CompressionResult["nativeSummarize"] = "not-requested"
      let summarizeError: string | undefined
      if (appliedMode !== "status" && currentModel) {
        try {
          const targetModel = resolveCompactionModel(
            pluginConfig,
            input.sessionID,
            currentModel.providerID,
            currentModel.modelID,
          )
          await ctx.client.session.summarize({
            path: { id: input.sessionID },
            body: {
              providerID: targetModel.providerID,
              modelID: targetModel.modelID,
              auto: true,
            } as never,
            query: { directory: ctx.directory },
          })
          nativeSummarize = "requested"
          log("[compress-context] Manual native summarize requested", {
            sessionID: input.sessionID,
            requestedMode,
            appliedMode,
            targetModel,
          })
        } catch (error) {
          nativeSummarize = "failed"
          summarizeError = error instanceof Error ? error.message : String(error)
          log("[compress-context] Manual native summarize failed", {
            sessionID: input.sessionID,
            requestedMode,
            appliedMode,
            error: summarizeError,
          })
        }
      }

      const note =
        appliedMode === "status"
          ? "Inspection only. No compression side effects beyond refreshing runtime summary files."
          : appliedMode === "l1"
            ? "L1 requested native compaction plus visible summary files."
            : appliedMode === "l2"
              ? "L2 refreshed local runtime memory and a light same-session auto checkpoint."
              : "L3 refreshed local runtime memory and prepared a heavy cross-session checkpoint without switching sessions automatically."

      const replacementText = buildCompressionResultPrompt({
        requestedMode,
        appliedMode,
        profile,
        nativeSummarize,
        summarizeError,
        carriedTokens,
        cacheReadTokens,
        contextLimit,
        usageRatio: snapshot?.usage_ratio,
        removedTokens: snapshot?.removed_tokens,
        removedMessages: snapshot?.removed_messages,
        compactedToolOutputs: snapshot?.compacted_tool_outputs,
        files,
        checkpointPath,
        note,
      })

      const firstTextPart = output.parts.find((part) => part.type === "text")
      if (firstTextPart) {
        firstTextPart.text = replacementText
      } else {
        output.parts.unshift({ type: "text", text: replacementText })
      }
    },
  }
}
