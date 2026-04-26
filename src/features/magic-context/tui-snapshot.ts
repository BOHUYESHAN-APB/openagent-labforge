import type { PluginInput } from "@opencode-ai/plugin"
import type { OhMyOpenCodeConfig } from "../../config"
import { getSessionTags } from "../../features/magic-context/storage/tags-storage"
import { getSessionPendingOps } from "../../features/magic-context/storage/pending-ops-storage"
import { loadSessionMeta } from "../../features/magic-context/storage/session-meta-storage"
import { getSessionCompartments } from "../../features/magic-context/storage/compartments-storage"
import { listMemories } from "../../features/magic-context/storage/memory-storage"
import { getRemainingTtl, formatTtl } from "../../features/magic-context/ttl-tracker"

export interface MagicContextSnapshot {
  sessionId: string
  usagePercentage: number
  inputTokens: number

  // Breakdown
  systemPromptTokens: number
  compartmentTokens: number
  memoryTokens: number
  conversationTokens: number

  // Counts
  activeTagCount: number
  droppedTagCount: number
  compactedTagCount: number
  pendingOpsCount: number
  memoryCount: number
  compartmentCount: number

  // Status
  cacheTtl: string
  cacheTtlRemaining: string
  lastResponseTime: number
  compressionCount: number
  lastCompressionTime?: number
}

/**
 * Capture a snapshot of Magic Context state for TUI visualization.
 */
export function captureMagicContextSnapshot(
  ctx: PluginInput,
  pluginConfig: OhMyOpenCodeConfig,
  sessionId: string,
  currentTokens?: {
    input: number
    output: number
    cacheRead: number
  },
): MagicContextSnapshot | null {
  const magicContextEnabled = pluginConfig.experimental?.magic_context?.enabled ?? false

  if (!magicContextEnabled) {
    return null
  }

  try {
    // Get tags
    const tags = getSessionTags(ctx.directory, sessionId)
    const activeTags = tags.filter(t => t.status === "active")
    const droppedTags = tags.filter(t => t.status === "dropped")
    const compactedTags = tags.filter(t => t.status === "compacted")

    // Get pending operations
    const pendingOps = getSessionPendingOps(ctx.directory, sessionId)

    // Get session metadata
    const sessionMeta = loadSessionMeta(ctx.directory, sessionId)

    // Get compartments
    const compartments = getSessionCompartments(ctx.directory, sessionId)

    // Get memories
    const memories = listMemories(ctx.directory, { status: "active" })

    // Calculate token breakdown (estimates)
    const totalInputTokens = currentTokens?.input ?? 0
    const compartmentTokens = compartments.reduce((sum, c) => sum + Math.floor(c.byteSize / 4), 0)
    const memoryTokens = memories.reduce((sum, m) => sum + Math.floor(m.content.length / 4), 0)
    const conversationTokens = activeTags.reduce((sum, t) => sum + Math.floor(t.byteSize / 4), 0)
    const systemPromptTokens = Math.max(0, totalInputTokens - compartmentTokens - memoryTokens - conversationTokens)

    // Calculate usage percentage
    // Note: In TUI context we don't have access to current model ID, so we use a reasonable default
    // The actual context window is tracked by context-window-monitor hook during session execution
    const contextLimit = 1_000_000 // Default to 1M (most modern models support this)
    const usagePercentage = (totalInputTokens / contextLimit) * 100

    // Get TTL info
    const cacheTtl = sessionMeta?.cacheTtl ?? "5m"
    const remainingTtl = sessionMeta
      ? getRemainingTtl(sessionMeta.lastResponseTime, sessionMeta.cacheTtl)
      : 0
    const cacheTtlRemaining = formatTtl(remainingTtl)

    return {
      sessionId,
      usagePercentage,
      inputTokens: totalInputTokens,

      systemPromptTokens,
      compartmentTokens,
      memoryTokens,
      conversationTokens,

      activeTagCount: activeTags.length,
      droppedTagCount: droppedTags.length,
      compactedTagCount: compactedTags.length,
      pendingOpsCount: pendingOps.length,
      memoryCount: memories.length,
      compartmentCount: compartments.length,

      cacheTtl,
      cacheTtlRemaining,
      lastResponseTime: sessionMeta?.lastResponseTime ?? Date.now(),
      compressionCount: sessionMeta?.compressionCount ?? 0,
      lastCompressionTime: sessionMeta?.lastCompressionTime,
    }
  } catch (error) {
    // Silently fail if snapshot capture fails
    return null
  }
}

/**
 * Format a Magic Context snapshot for TUI display.
 */
export function formatMagicContextSidebar(snapshot: MagicContextSnapshot): string {
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
    return String(tokens)
  }

  const usageBar = generateUsageBar(snapshot.usagePercentage)

  return `
╭─ Magic Context ─────────────────╮
│ Usage: ${snapshot.usagePercentage.toFixed(1)}% (${formatTokens(snapshot.inputTokens)})
│ ${usageBar}
│
│ Breakdown:
│   System:  ${formatTokens(snapshot.systemPromptTokens)}
│   Memory:  ${formatTokens(snapshot.memoryTokens)}
│   History: ${formatTokens(snapshot.conversationTokens)}
│   Archive: ${formatTokens(snapshot.compartmentTokens)}
│
│ Tags: ${snapshot.activeTagCount} active, ${snapshot.compactedTagCount} archived
│ Pending: ${snapshot.pendingOpsCount} ops
│ Memories: ${snapshot.memoryCount}
│
│ Cache TTL: ${snapshot.cacheTtl} (${snapshot.cacheTtlRemaining} left)
│ Compressions: ${snapshot.compressionCount}
╰─────────────────────────────────╯
  `.trim()
}

function generateUsageBar(percentage: number): string {
  const width = 30
  const filled = Math.floor((percentage / 100) * width)
  const empty = width - filled

  let color = "green"
  if (percentage >= 80) color = "red"
  else if (percentage >= 60) color = "yellow"

  return `[${"█".repeat(filled)}${" ".repeat(empty)}]`
}
