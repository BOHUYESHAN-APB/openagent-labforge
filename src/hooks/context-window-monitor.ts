import type { PluginInput } from "@opencode-ai/plugin"
import type { OhMyOpenCodeConfig } from "../config"
import { existsSync, mkdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { log } from "../shared/logger"
import { createSystemDirective, SystemDirectiveTypes } from "../shared/system-directive"
import {
  buildCompressionDirectiveText,
  resolveCompressionProfile,
} from "./context-window-monitor-directive"
import { writeAutoCompressionCheckpoint } from "./context-window-monitor-checkpoint"
import {
  getContextGuardNoticeLevel,
  resolveContextGuardProfile,
  type ContextGuardProfile,
  type ContextGuardThresholdOverrides,
} from "./context-guard-threshold-profile"
import { writeFileAtomically, writeJSONAtomically } from "../shared/write-file-atomically"

const PRESETS = {
  conservative: {
    twoHundredK: { keepRecentMessagesL1: 110, keepRecentMessagesL2: 80, keepRecentMessagesL3: 50 },
    fourHundredK: { keepRecentMessagesL1: 220, keepRecentMessagesL2: 160, keepRecentMessagesL3: 100 },
    oneMillion: { keepRecentMessagesL1: 550, keepRecentMessagesL2: 400, keepRecentMessagesL3: 250 }
  },
  "conservative-plus": {
    twoHundredK: { keepRecentMessagesL1: 110, keepRecentMessagesL2: 80, keepRecentMessagesL3: 50 },
    fourHundredK: { keepRecentMessagesL1: 220, keepRecentMessagesL2: 160, keepRecentMessagesL3: 100 },
    oneMillion: { keepRecentMessagesL1: 550, keepRecentMessagesL2: 400, keepRecentMessagesL3: 250 }
  },
  balanced: {
    twoHundredK: { keepRecentMessagesL1: 100, keepRecentMessagesL2: 70, keepRecentMessagesL3: 40 },
    fourHundredK: { keepRecentMessagesL1: 200, keepRecentMessagesL2: 140, keepRecentMessagesL3: 80 },
    oneMillion: { keepRecentMessagesL1: 500, keepRecentMessagesL2: 350, keepRecentMessagesL3: 200 }
  },
  "balanced-plus": {
    twoHundredK: { keepRecentMessagesL1: 100, keepRecentMessagesL2: 70, keepRecentMessagesL3: 40 },
    fourHundredK: { keepRecentMessagesL1: 200, keepRecentMessagesL2: 140, keepRecentMessagesL3: 80 },
    oneMillion: { keepRecentMessagesL1: 500, keepRecentMessagesL2: 350, keepRecentMessagesL3: 200 }
  },
  aggressive: {
    twoHundredK: { keepRecentMessagesL1: 90, keepRecentMessagesL2: 60, keepRecentMessagesL3: 35 },
    fourHundredK: { keepRecentMessagesL1: 180, keepRecentMessagesL2: 120, keepRecentMessagesL3: 70 },
    oneMillion: { keepRecentMessagesL1: 450, keepRecentMessagesL2: 300, keepRecentMessagesL3: 175 }
  },
  "aggressive-plus": {
    twoHundredK: { keepRecentMessagesL1: 90, keepRecentMessagesL2: 60, keepRecentMessagesL3: 35 },
    fourHundredK: { keepRecentMessagesL1: 180, keepRecentMessagesL2: 120, keepRecentMessagesL3: 70 },
    oneMillion: { keepRecentMessagesL1: 450, keepRecentMessagesL2: 300, keepRecentMessagesL3: 175 }
  },
}

function applyThresholdOverrides(
  preset: typeof PRESETS[keyof typeof PRESETS],
  _overrides?: ContextGuardThresholdOverrides,
) {
  return preset
}

const ANTHROPIC_DISPLAY_LIMIT = 1_000_000
// Modern Anthropic Claude models default to 1M context
// Only fall back to 200K if explicitly disabled via legacy env var
const DEFAULT_ANTHROPIC_ACTUAL_LIMIT = 1_000_000
const CONTEXT_WARNING_THRESHOLD = 0.70
// Use 128K as conservative default for unknown models
const DEFAULT_MODEL_CONTEXT_LIMIT = 128_000

type ModelCacheStateLike = {
  anthropicContext1MEnabled: boolean
  modelContextLimitsCache?: Map<string, number>
}

function getAnthropicActualLimit(modelCacheState?: ModelCacheStateLike): number {
  // Check if explicitly disabled (legacy behavior)
  if (process.env.ANTHROPIC_1M_CONTEXT === "false" || process.env.VERTEX_ANTHROPIC_1M_CONTEXT === "false") {
    return 200_000
  }
  // Default to 1M for modern Claude models
  return 1_000_000
}

const CONTEXT_REMINDER = `${createSystemDirective(SystemDirectiveTypes.CONTEXT_WINDOW_MONITOR)}

You are using Anthropic Claude with 1M context window.
You have plenty of context remaining - do NOT rush or skip tasks.
Complete your work thoroughly and methodically.`

interface TokenInfo {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

interface CachedTokenState {
  providerID: string
  modelID?: string
  tokens: TokenInfo
}

interface CompressionTransformStats {
  removedTokens: number
  removedMessages: number
  compactedToolOutputs: number
}

interface MessageWithParts {
  info: {
    id?: string
    role?: string
    sessionID?: string
  }
  parts: Array<Record<string, unknown>>
}

function isAnthropicProvider(providerID: string): boolean {
  return providerID === "anthropic" || providerID === "google-vertex-anthropic"
}

function inferContextLimit(providerID: string, modelID: string | undefined, modelCacheState?: ModelCacheStateLike): number | null {
  if (modelID) {
    const cached = modelCacheState?.modelContextLimitsCache?.get(`${providerID}/${modelID}`)
    if (cached && cached > 0) return cached
  }

  // Try to get from connected providers cache
  if (modelID) {
    try {
      const { getModelContextWindow } = require("../shared/connected-providers-cache")
      const contextFromCache = getModelContextWindow(modelID)
      if (contextFromCache && contextFromCache > 0) {
        return contextFromCache
      }
    } catch {
      // Ignore if module not available
    }
  }

  if (isAnthropicProvider(providerID)) {
    return getAnthropicActualLimit(modelCacheState)
  }

  // Return null for unknown models to avoid incorrect assumptions
  // Caller should handle null and use a conservative default
  return null
}

function formatCompactTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return String(tokens)
}

function buildProgressBar(ratio: number): string {
  const width = 30
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)))
  return `${"#".repeat(filled)}${".".repeat(width - filled)}`
}

function getRuntimeCapsulePath(directory: string, sessionID: string): string {
  return join(directory, ".opencode", "openagent-labforge", "runtime", sessionID, "context-capsule.md")
}

function getCompressionStatePath(directory: string, sessionID: string): string {
  return join(directory, ".opencode", "openagent-labforge", "runtime", sessionID, "context-pressure.json")
}

type CompressionHistoryEntry = {
  level: number
  carried_tokens: number
  timestamp: string
  action: "micro-prune" | "checkpoint" | "preemptive"
  removed_tokens: number
  compression_ratio: number
}

type CompressionState = {
  session_id: string
  provider_id: string
  model_id: string
  carried_tokens: number
  cache_read_tokens: number
  context_limit: number
  usage_ratio: number
  level: number
  removed_tokens: number
  removed_messages: number
  compacted_tool_outputs: number
  updated_at: string
  history?: CompressionHistoryEntry[]
}

function writeLocalContextCapsule(args: {
  directory: string
  sessionID: string
  cached: CachedTokenState
  limit: number
  totalInputTokens: number
  level: number
}): number {
  const { directory, sessionID, cached, limit, totalInputTokens, level } = args
  const path = getRuntimeCapsulePath(directory, sessionID)
  const ratio = totalInputTokens / limit
  const content = [
    "# Labforge Context Capsule",
    "",
    `- Session: \`${sessionID}\``,
    `- Provider/model: \`${cached.providerID}/${cached.modelID ?? "unknown"}\``,
    `- Context carried: \`${formatCompactTokens(totalInputTokens)} / ${formatCompactTokens(limit)} (${(ratio * 100).toFixed(1)}%)\``,
    `- Cache read: \`${formatCompactTokens(cached.tokens.cache?.read ?? 0)}\``,
    `- Compression level: \`${level}\``,
    "- Rule: keep only the active wave in chat; put durable bio/academic evidence into project files or explicit ledgers.",
    "- Rule: do not reread this capsule every turn. Load it only after compaction, resume, checkpoint, or explicit recovery.",
    level >= 2
      ? "- Recommendation: finish the current wave, then create a checkpoint before opening new analysis branches."
      : "- Recommendation: continue the current wave but avoid broad new branches.",
    "",
  ].join("\n")

  try {
    writeFileAtomically(path, content, "utf-8")
    return Math.ceil(content.length / 4)
  } catch {
    return 0
  }
}

function writeCompressionState(args: {
  directory: string
  sessionID: string
  cached: CachedTokenState
  limit: number
  totalInputTokens: number
  level: number
  stats?: CompressionTransformStats
}): void {
  const { directory, sessionID, cached, limit, totalInputTokens, level, stats } = args
  const path = getCompressionStatePath(directory, sessionID)

  // Read existing state to preserve history
  let existingState: CompressionState | undefined
  try {
    if (existsSync(path)) {
      const content = readFileSync(path, "utf-8")
      existingState = JSON.parse(content) as CompressionState
    }
  } catch {
    // Ignore read errors
  }

  const removedTokens = stats?.removedTokens ?? 0
  const compressionRatio = totalInputTokens > 0 ? removedTokens / totalInputTokens : 0

  // Determine action type
  let action: "micro-prune" | "checkpoint" | "preemptive" = "micro-prune"
  if (level >= 2) {
    action = "checkpoint"
  }

  // Create new history entry
  const newEntry: CompressionHistoryEntry = {
    level,
    carried_tokens: totalInputTokens,
    timestamp: new Date().toISOString(),
    action,
    removed_tokens: removedTokens,
    compression_ratio: Number(compressionRatio.toFixed(4)),
  }

  // Preserve existing history and append new entry
  const history = existingState?.history ?? []
  history.push(newEntry)

  // Keep only last 50 entries
  const trimmedHistory = history.slice(-50)

  const payload: CompressionState = {
    session_id: sessionID,
    provider_id: cached.providerID,
    model_id: cached.modelID ?? "",
    carried_tokens: totalInputTokens,
    cache_read_tokens: cached.tokens.cache?.read ?? 0,
    context_limit: limit,
    usage_ratio: Number((totalInputTokens / limit).toFixed(4)),
    level,
    removed_tokens: stats?.removedTokens ?? 0,
    removed_messages: stats?.removedMessages ?? 0,
    compacted_tool_outputs: stats?.compactedToolOutputs ?? 0,
    updated_at: new Date().toISOString(),
    history: trimmedHistory,
  }

  try {
    writeJSONAtomically(path, payload)
  } catch {
  }
}

function buildLabforgeCompressionNotice(args: {
  level: number
  profile: "engineering" | "bio"
  thresholdProfile: ContextGuardProfile
  ratio: number
  totalInputTokens: number
  cacheReadTokens: number
  localCapsuleTokens: number
  removedTokens?: number
  compactedToolOutputs?: number
  removedMessages?: number
  checkpointPath?: string
  limit: number
}): string {
  const {
    level,
    profile,
    thresholdProfile,
    ratio,
    totalInputTokens,
    cacheReadTokens,
    localCapsuleTokens,
    removedTokens = 0,
    compactedToolOutputs = 0,
    removedMessages = 0,
    checkpointPath,
    limit,
  } = args
  const topic = level >= 3
    ? "Severe context debt"
    : level >= 2
      ? "Checkpoint recommended"
      : "Local capsule refreshed"
  const action = level >= 2
    ? "close current wave before opening new branches"
    : "continue current wave with local memory discipline"
  const files = [
    ".opencode/openagent-labforge/runtime/<session>/context-capsule.md",
    ".opencode/openagent-labforge/runtime/<session>/context-pressure.json",
    ...(checkpointPath ? [checkpointPath] : []),
  ]

  return `${createSystemDirective(SystemDirectiveTypes.CONTEXT_WINDOW_MONITOR)}

▣ Labforge | ${formatCompactTokens(totalInputTokens)} carried, ${formatCompactTokens(cacheReadTokens)} cache, +${formatCompactTokens(localCapsuleTokens)} local
│${buildProgressBar(ratio)}│
▣ Compression guard L${level} (${(ratio * 100).toFixed(1)}% of ${formatCompactTokens(limit)})
→ Profile: ${profile}
→ Threshold preset: ${thresholdProfile}
→ Topic: ${topic}
→ Action: ${action}
${removedTokens > 0 || compactedToolOutputs > 0 || removedMessages > 0
    ? `→ Pruned: -${formatCompactTokens(removedTokens)} stale, ${removedMessages} messages, ${compactedToolOutputs} tool outputs compacted`
    : "→ Pruned: -0 stale, 0 messages, 0 tool outputs compacted"}
→ Files: ${files.join(", ")}
${checkpointPath ? `→ Checkpoint: ${checkpointPath}` : "→ Checkpoint: pending"}
→ Tune guard: run /ol-settings and choose Context Guard preset.`
}

async function showLabforgeCompressionToast(ctx: PluginInput, args: {
  level: number
  totalInputTokens: number
  limit: number
  removedTokens: number
  checkpointPath?: string
}): Promise<void> {
  const tui = (ctx.client as { tui?: { showToast?: (input: unknown) => Promise<unknown> } }).tui
  if (!tui?.showToast) return

  await tui.showToast({
    body: {
      title: "Labforge Context Guard",
      message: `L${args.level} refreshed at ${formatCompactTokens(args.totalInputTokens)}/${formatCompactTokens(args.limit)}. Micro-pruned ${formatCompactTokens(args.removedTokens)}. Files: context-capsule.md, context-pressure.json${args.checkpointPath ? ", auto checkpoint" : ""}.`,
      variant: "warning",
      duration: 5000,
    },
  }).catch(() => {})
}

function estimateTokensFromText(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}

function looksLikeCompressionNotice(text: string): boolean {
  const normalized = text.trim()
  return normalized.includes("▣ DCP |") ||
    normalized.includes("Compression #") ||
    normalized.includes("▣ Labforge |") ||
    normalized.includes("Compression guard L")
}

function compactToolPartOutput(part: Record<string, unknown>, threshold: number): number {
  const state = typeof part["state"] === "object" && part["state"] !== null
    ? (part["state"] as Record<string, unknown>)
    : null
  if (!state) return 0
  if (state["status"] !== "completed") return 0
  if (typeof state["output"] !== "string") return 0
  const output = state["output"] as string
  if (output.length < threshold) return 0

  const removed = estimateTokensFromText(output)
  state["output"] = "[Labforge compacted stale tool output]"
  return removed
}

function injectCompressionDirective(
  messages: MessageWithParts[],
  sessionID: string,
  level: number,
  ratio?: number
): void {
  if (level < 1) return

  let lastUserMessageIndex = -1
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].info.role === "user") {
      lastUserMessageIndex = index
      break
    }
  }

  if (lastUserMessageIndex === -1) return
  const lastUserMessage = messages[lastUserMessageIndex]
  const alreadyInjected = lastUserMessage.parts.some((part) => part["id"] === `synthetic_labforge_compress_${sessionID}`)
  if (alreadyInjected) return

  const profile = resolveCompressionProfile(messages)
  const directiveText = buildCompressionDirectiveText({ level, profile, ratio })

  const syntheticPart = {
    id: `synthetic_labforge_compress_${sessionID}`,
    messageID: lastUserMessage.info.id ?? "",
    sessionID,
    type: "text",
    text: directiveText,
    synthetic: true,
  }

  const textPartIndex = lastUserMessage.parts.findIndex((part) => part["type"] === "text")
  if (textPartIndex === -1) {
    lastUserMessage.parts.unshift(syntheticPart)
    return
  }
  lastUserMessage.parts.splice(textPartIndex, 0, syntheticPart)
}

function getKeepRecentMessages(
  level: number,
  contextLimit: number,
  profile: ContextGuardProfile,
  overrides?: ContextGuardThresholdOverrides,
): number {
  const preset = applyThresholdOverrides(PRESETS[profile], overrides)

  // 1M 档位使用配置的保留消息数 (>= 600K)
  if (contextLimit >= 600_000) {
    if (level >= 3) return preset.oneMillion.keepRecentMessagesL3
    if (level >= 2) return preset.oneMillion.keepRecentMessagesL2
    return preset.oneMillion.keepRecentMessagesL1
  }

  // 400K 档位使用配置的保留消息数 (300K - 600K, 覆盖 256K=262144 和 400K)
  if (contextLimit >= 300_000 && contextLimit < 600_000) {
    if (level >= 3) return preset.fourHundredK.keepRecentMessagesL3
    if (level >= 2) return preset.fourHundredK.keepRecentMessagesL2
    return preset.fourHundredK.keepRecentMessagesL1
  }

  // 200K 档位使用配置的保留消息数 (180K - 300K)
  if (contextLimit >= 180_000 && contextLimit < 300_000) {
    if (level >= 3) return preset.twoHundredK.keepRecentMessagesL3
    if (level >= 2) return preset.twoHundredK.keepRecentMessagesL2
    return preset.twoHundredK.keepRecentMessagesL1
  }

  // 其他档位使用默认值（保持不变）
  if (level >= 3) return 28
  if (level >= 2) return 48
  return 72
}

function applyMicroPrune(
  messages: MessageWithParts[],
  level: number,
  contextLimit: number,
  profile: ContextGuardProfile,
  overrides?: ContextGuardThresholdOverrides,
  microPruneThreshold?: number,
): CompressionTransformStats {
  if (level < 1) {
    return { removedTokens: 0, removedMessages: 0, compactedToolOutputs: 0 }
  }

  const threshold = microPruneThreshold ?? 500
  const keepRecentMessages = getKeepRecentMessages(level, contextLimit, profile, overrides)
  const preserveStart = Math.max(0, messages.length - keepRecentMessages)
  const result: MessageWithParts[] = []
  let removedTokens = 0
  let removedMessages = 0
  let compactedToolOutputs = 0

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index]
    if (index >= preserveStart) {
      result.push(message)
      continue
    }

    const textContent = message.parts
      .filter((part) => part["type"] === "text" && typeof part["text"] === "string")
      .map((part) => String(part["text"]))
      .join("\n")

    if (textContent.length > 0 && looksLikeCompressionNotice(textContent)) {
      removedTokens += estimateTokensFromText(textContent)
      removedMessages += 1
      continue
    }

    for (const part of message.parts) {
      const removed = compactToolPartOutput(part, threshold)
      if (removed > 0) {
        removedTokens += removed
        compactedToolOutputs += 1
      }
    }

    result.push(message)
  }

  messages.length = 0
  messages.push(...result)

  return {
    removedTokens,
    removedMessages,
    compactedToolOutputs,
  }
}

export function createContextWindowMonitorHook(
  ctx: PluginInput,
  modelCacheState?: ModelCacheStateLike,
  pluginConfig?: Pick<OhMyOpenCodeConfig, "experimental">,
) {
  const contextGuardProfile = resolveContextGuardProfile(
    pluginConfig?.experimental?.context_guard_profile,
  )
  const contextGuardThresholdOverrides = pluginConfig?.experimental?.context_guard_thresholds
  const remindedSessions = new Set<string>()
  const labforgeNoticeLevels = new Map<string, number>()
  const labforgeTransformNoticeLevels = new Map<string, number>()
  const tokenCache = new Map<string, CachedTokenState>()
  const lastTransformStats = new Map<string, CompressionTransformStats>()
  const sessionProfiles = new Map<string, "engineering" | "bio">()

  const toolExecuteAfter = async (
    input: { tool: string; sessionID: string; callID: string },
    output: { title: string; output: string; metadata: unknown }
  ) => {
    const { sessionID } = input

    const cached = tokenCache.get(sessionID)
    if (!cached) return

    const lastTokens = cached.tokens
    // 计算实际输入 tokens = 未命中缓存 + 命中缓存
    // 这才是真正占用上下文窗口的 tokens
    const totalInputTokens = (lastTokens?.input ?? 0) + (lastTokens?.cache?.read ?? 0)
    const actualLimit = inferContextLimit(cached.providerID, cached.modelID, modelCacheState)

    // 如果无法确定上下文限制，跳过警告
    if (!actualLimit) {
      return
    }

    const actualUsagePercentage = totalInputTokens / actualLimit
    const noticeLevel = getContextGuardNoticeLevel({
      ratio: actualUsagePercentage,
      totalTokens: totalInputTokens,
      contextLimit: actualLimit,
      profile: contextGuardProfile,
      overrides: contextGuardThresholdOverrides,
    })

    if (noticeLevel > 0 && noticeLevel > (labforgeNoticeLevels.get(sessionID) ?? 0)) {
      labforgeNoticeLevels.set(sessionID, noticeLevel)
      const profile = sessionProfiles.get(sessionID) ?? "engineering"
      const localCapsuleTokens = writeLocalContextCapsule({
        directory: ctx.directory,
        sessionID,
        cached,
        limit: actualLimit,
        totalInputTokens,
        level: noticeLevel,
      })
      const stats = lastTransformStats.get(sessionID)
      const checkpoint =
        noticeLevel >= 2
          ? writeAutoCompressionCheckpoint(
              {
                directory: ctx.directory,
                sessionID,
                level: noticeLevel,
                profile,
                totalInputTokens,
                cacheReadTokens: lastTokens.cache?.read ?? 0,
                contextLimit: actualLimit,
              },
              pluginConfig?.experimental?.checkpoint_retention,
            )
          : undefined
      writeCompressionState({
        directory: ctx.directory,
        sessionID,
        cached,
        limit: actualLimit,
        totalInputTokens,
        level: noticeLevel,
        stats,
      })

      log("[context-window-monitor] Context guard level crossed after tool execution", {
        sessionID,
        level: noticeLevel,
        profile,
        totalInputTokens,
        actualLimit,
        removedTokens: stats?.removedTokens ?? 0,
        checkpointPath: checkpoint?.markdownPath,
      })

      output.output += `\n\n${buildLabforgeCompressionNotice({
        level: noticeLevel,
        profile,
        thresholdProfile: contextGuardProfile,
        ratio: actualUsagePercentage,
        totalInputTokens,
        cacheReadTokens: lastTokens.cache?.read ?? 0,
        localCapsuleTokens,
        removedTokens: stats?.removedTokens,
        compactedToolOutputs: stats?.compactedToolOutputs,
        removedMessages: stats?.removedMessages,
        checkpointPath: checkpoint?.markdownPath
          ? ".opencode/openagent-labforge/checkpoints/auto/latest.md"
          : undefined,
        limit: actualLimit,
      })}`

      await showLabforgeCompressionToast(ctx, {
        level: noticeLevel,
        totalInputTokens,
        limit: actualLimit,
        removedTokens: stats?.removedTokens ?? 0,
        checkpointPath: checkpoint?.markdownPath,
      })
    }

    if (remindedSessions.has(sessionID)) return
    if (!isAnthropicProvider(cached.providerID)) return

    if (actualUsagePercentage < CONTEXT_WARNING_THRESHOLD) return

    remindedSessions.add(sessionID)

    const displayUsagePercentage = totalInputTokens / ANTHROPIC_DISPLAY_LIMIT
    const usedPct = (displayUsagePercentage * 100).toFixed(1)
    const remainingPct = ((1 - displayUsagePercentage) * 100).toFixed(1)
    const usedTokens = totalInputTokens.toLocaleString()
    const limitTokens = ANTHROPIC_DISPLAY_LIMIT.toLocaleString()

    output.output += `\n\n${CONTEXT_REMINDER}
[Context Status: ${usedPct}% used (${usedTokens}/${limitTokens} tokens), ${remainingPct}% remaining]`
  }

  const eventHandler = async ({ event }: { event: { type: string; properties?: unknown } }) => {
    const props = event.properties as Record<string, unknown> | undefined

    if (event.type === "session.deleted") {
      const sessionInfo = props?.info as { id?: string } | undefined
      if (sessionInfo?.id) {
        remindedSessions.delete(sessionInfo.id)
        labforgeNoticeLevels.delete(sessionInfo.id)
        labforgeTransformNoticeLevels.delete(sessionInfo.id)
        lastTransformStats.delete(sessionInfo.id)
        sessionProfiles.delete(sessionInfo.id)
        tokenCache.delete(sessionInfo.id)
      }
    }

    if (event.type === "session.compacted") {
      const sessionID = (props?.sessionID ??
        (props?.info as { id?: string } | undefined)?.id) as string | undefined
      if (sessionID) {
        remindedSessions.delete(sessionID)
        labforgeNoticeLevels.delete(sessionID)
        labforgeTransformNoticeLevels.delete(sessionID)
        lastTransformStats.delete(sessionID)
        sessionProfiles.delete(sessionID)
        tokenCache.delete(sessionID)
      }
    }

    if (event.type === "message.updated") {
      const info = props?.info as {
        role?: string
        sessionID?: string
        providerID?: string
        modelID?: string
        finish?: boolean
        tokens?: TokenInfo
      } | undefined

      if (!info || info.role !== "assistant" || !info.finish) return
      if (!info.sessionID || !info.providerID || !info.tokens) return

      tokenCache.set(info.sessionID, {
        providerID: info.providerID,
        modelID: info.modelID,
        tokens: info.tokens,
      })
    }
  }

  const messagesTransform = async (
    _input: Record<string, never>,
    output: { messages: MessageWithParts[] },
  ): Promise<void> => {
    const { messages } = output
    if (messages.length === 0) return

    let sessionID: string | undefined
    for (let index = messages.length - 1; index >= 0; index--) {
      const candidate = messages[index].info.sessionID
      if (candidate) {
        sessionID = candidate
        break
      }
    }
    if (!sessionID) return

    const cached = tokenCache.get(sessionID)
    if (!cached) return

    const totalInputTokens = (cached.tokens.input ?? 0) + (cached.tokens.cache?.read ?? 0)
    const actualLimit = inferContextLimit(cached.providerID, cached.modelID, modelCacheState)

    // 如果无法确定上下文限制，跳过处理
    if (!actualLimit) {
      return
    }

    const usageRatio = totalInputTokens / actualLimit
    const level = getContextGuardNoticeLevel({
      ratio: usageRatio,
      totalTokens: totalInputTokens,
      contextLimit: actualLimit,
      profile: contextGuardProfile,
      overrides: contextGuardThresholdOverrides,
    })
    if (level < 1) return

    const stats = applyMicroPrune(
      messages,
      level,
      actualLimit,
      contextGuardProfile,
      contextGuardThresholdOverrides,
      pluginConfig?.experimental?.context_compression?.micro_prune_threshold,
    )
    lastTransformStats.set(sessionID, stats)
    const profile = resolveCompressionProfile(messages)
    sessionProfiles.set(sessionID, profile)
    injectCompressionDirective(messages, sessionID, level, usageRatio)
    const checkpoint = level >= 2
      ? writeAutoCompressionCheckpoint(
          {
            directory: ctx.directory,
            sessionID,
            level,
            profile,
            totalInputTokens,
            cacheReadTokens: cached.tokens.cache?.read ?? 0,
            contextLimit: actualLimit,
          },
          pluginConfig?.experimental?.checkpoint_retention,
        )
      : undefined
    writeCompressionState({
      directory: ctx.directory,
      sessionID,
      cached,
      limit: actualLimit,
      totalInputTokens,
      level,
      stats,
    })

    if (level >= 1 && level > (labforgeTransformNoticeLevels.get(sessionID) ?? 0)) {
      labforgeTransformNoticeLevels.set(sessionID, level)
      log("[context-window-monitor] Context guard level crossed during message transform", {
        sessionID,
        level,
        profile,
        totalInputTokens,
        actualLimit,
        removedTokens: stats.removedTokens,
        removedMessages: stats.removedMessages,
        compactedToolOutputs: stats.compactedToolOutputs,
        checkpointPath: checkpoint?.markdownPath,
      })
      await showLabforgeCompressionToast(ctx, {
        level,
        totalInputTokens,
        limit: actualLimit,
        removedTokens: stats.removedTokens,
        checkpointPath: checkpoint?.markdownPath,
      })
    }
  }

  return {
    "tool.execute.after": toolExecuteAfter,
    event: eventHandler,
    "experimental.chat.messages.transform": messagesTransform,
  }
}
