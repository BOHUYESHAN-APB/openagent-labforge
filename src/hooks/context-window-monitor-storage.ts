import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { CachedTokenState, CompressionTransformStats } from "./context-window-monitor-thresholds"
import { formatCompactTokens } from "./context-window-monitor-thresholds"

function getRuntimeCapsulePath(directory: string, sessionID: string): string {
  return join(directory, ".opencode", "openagent-labforge", "runtime", sessionID, "context-capsule.md")
}

function getCompressionStatePath(directory: string, sessionID: string): string {
  return join(directory, ".opencode", "openagent-labforge", "runtime", sessionID, "context-pressure.json")
}

export function writeLocalContextCapsule(args: {
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
    if (!existsSync(dirname(path))) {
      mkdirSync(dirname(path), { recursive: true })
    }
    writeFileSync(path, content, "utf-8")
    return Math.ceil(content.length / 4)
  } catch {
    return 0
  }
}

export function writeCompressionState(args: {
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
  const payload = {
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
  }

  try {
    if (!existsSync(dirname(path))) {
      mkdirSync(dirname(path), { recursive: true })
    }
    writeFileSync(path, JSON.stringify(payload, null, 2), "utf-8")
  } catch {
  }
}
