import { tool } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import type { OhMyOpenCodeConfig } from "../../config"
import { getSessionPendingOps } from "../../features/magic-context/storage/pending-ops-storage"
import { getSessionTags } from "../../features/magic-context/storage/tags-storage"
import { loadSessionMeta } from "../../features/magic-context/storage/session-meta-storage"
import { getRemainingTtl, formatTtl } from "../../features/magic-context/ttl-tracker"
import { log } from "../../shared/logger"

/**
 * ctx_search tool - Unified search across tags, pending ops, and session state
 */
export function createCtxSearchTool(
  ctx: PluginInput,
  pluginConfig: OhMyOpenCodeConfig,
) {
  const magicContextEnabled = pluginConfig.experimental?.magic_context?.enabled ?? false

  if (!magicContextEnabled) {
    return null
  }

  return tool({
    description: "Search and inspect Magic Context state: tags, pending operations, TTL status, and session metadata.",
    args: {},
    execute: async (_args, context) => {
      const sessionId = context.sessionID
      try {
        const tags = getSessionTags(ctx.directory, sessionId)
        const pendingOps = getSessionPendingOps(ctx.directory, sessionId)
        const sessionMeta = loadSessionMeta(ctx.directory, sessionId)

        const activeTags = tags.filter(t => t.status === "active")
        const droppedTags = tags.filter(t => t.status === "dropped")
        const compactedTags = tags.filter(t => t.status === "compacted")

        const lines = [
          "## Magic Context Status",
          "",
          "### Session Metadata",
        ]

        if (sessionMeta) {
          const remainingTtl = getRemainingTtl(sessionMeta.lastResponseTime, sessionMeta.cacheTtl)
          lines.push(
            `- Cache TTL: ${sessionMeta.cacheTtl} (${formatTtl(remainingTtl)} remaining)`,
            `- Last response: ${new Date(sessionMeta.lastResponseTime).toLocaleString()}`,
            `- Compressions: ${sessionMeta.compressionCount}`,
          )
          if (sessionMeta.lastCompressionTime) {
            lines.push(`- Last compression: ${new Date(sessionMeta.lastCompressionTime).toLocaleString()}`)
          }
        } else {
          lines.push("- No metadata found")
        }

        lines.push(
          "",
          "### Tags",
          `- Active: ${activeTags.length}`,
          `- Dropped: ${droppedTags.length}`,
          `- Compacted: ${compactedTags.length}`,
          `- Total: ${tags.length}`,
          "",
          "### Pending Operations",
          `- Queued: ${pendingOps.length}`,
        )

        if (pendingOps.length > 0) {
          lines.push("")
          for (const op of pendingOps) {
            const age = Date.now() - op.timestamp
            lines.push(
              `  - [${op.type}] ${op.reason} (${Math.floor(age / 1000)}s ago)`,
            )
          }
        }

        const totalBytes = activeTags.reduce((sum, t) => sum + t.byteSize, 0)
        lines.push(
          "",
          "### Storage",
          `- Active tags size: ${(totalBytes / 1024).toFixed(1)}KB`,
        )

        log("[ctx_search] Status retrieved", {
          sessionId,
          activeTags: activeTags.length,
          pendingOps: pendingOps.length,
        })

        return lines.join("\n")
      } catch (error) {
        log("[ctx_search] Error", {
          sessionId,
          error: error instanceof Error ? error.message : String(error),
        })
        return `Error: ${error instanceof Error ? error.message : String(error)}`
      }
    },
  })
}
