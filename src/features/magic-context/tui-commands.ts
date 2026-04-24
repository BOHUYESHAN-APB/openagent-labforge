import type { PluginInput } from "@opencode-ai/plugin"
import type { OhMyOpenCodeConfig } from "../../config"
import { captureMagicContextSnapshot, formatMagicContextSidebar } from "../../features/magic-context/tui-snapshot"
import { getSessionPendingOps, executePendingOps } from "../../features/magic-context/storage/pending-ops-storage"
import { getSessionTags } from "../../features/magic-context/storage/tags-storage"
import { getSessionCompartments } from "../../features/magic-context/storage/compartments-storage"
import { log } from "../../shared/logger"

/**
 * /ctx-status command - Show detailed Magic Context status
 */
export function createCtxStatusCommand(
  ctx: PluginInput,
  pluginConfig: OhMyOpenCodeConfig,
) {
  return {
    name: "ctx-status",
    description: "Show detailed Magic Context status and debug information",
    execute: async (sessionId: string) => {
      const snapshot = captureMagicContextSnapshot(ctx, pluginConfig, sessionId)

      if (!snapshot) {
        return "Magic Context is not enabled. Set experimental.magic_context.enabled = true in config."
      }

      const tags = getSessionTags(ctx.directory, sessionId)
      const pendingOps = getSessionPendingOps(ctx.directory, sessionId)
      const compartments = getSessionCompartments(ctx.directory, sessionId)

      const lines = [
        "# Magic Context Status",
        "",
        formatMagicContextSidebar(snapshot),
        "",
        "## Tags Breakdown",
        `- Active: ${snapshot.activeTagCount}`,
        `- Dropped: ${snapshot.droppedTagCount}`,
        `- Compacted: ${snapshot.compactedTagCount}`,
        `- Total: ${tags.length}`,
        "",
        "## Pending Operations",
      ]

      if (pendingOps.length === 0) {
        lines.push("- None")
      } else {
        for (const op of pendingOps) {
          const age = Math.floor((Date.now() - op.timestamp) / 1000)
          lines.push(`- [${op.type}] ${op.reason} (${age}s ago)`)
        }
      }

      lines.push(
        "",
        "## Compartments",
        `- Total: ${compartments.length}`,
      )

      if (compartments.length > 0) {
        for (const c of compartments.slice(0, 5)) {
          lines.push(`- #${c.sequence}: §${c.startTag}§-§${c.endTag}§ "${c.title}"`)
        }
        if (compartments.length > 5) {
          lines.push(`- ... and ${compartments.length - 5} more`)
        }
      }

      log("[ctx-status] Status displayed", { sessionId })

      return lines.join("\n")
    },
  }
}

/**
 * /ctx-flush command - Force execute all pending operations
 */
export function createCtxFlushCommand(
  ctx: PluginInput,
  pluginConfig: OhMyOpenCodeConfig,
) {
  return {
    name: "ctx-flush",
    description: "Force execute all pending Magic Context operations",
    execute: async (sessionId: string) => {
      const pendingOps = getSessionPendingOps(ctx.directory, sessionId)

      if (pendingOps.length === 0) {
        return "No pending operations to flush."
      }

      const executed = executePendingOps(ctx.directory, sessionId)

      log("[ctx-flush] Flushed pending operations", {
        sessionId,
        count: executed,
      })

      return `Flushed ${executed} pending operations.`
    },
  }
}

/**
 * /ctx-clear command - Clear all Magic Context state for current session
 */
export function createCtxClearCommand(
  ctx: PluginInput,
  pluginConfig: OhMyOpenCodeConfig,
) {
  return {
    name: "ctx-clear",
    description: "Clear all Magic Context state for the current session (WARNING: destructive)",
    execute: async (sessionId: string) => {
      // This is a destructive operation, so we just return a warning for now
      // Full implementation would clear tags, pending ops, session meta, etc.

      log("[ctx-clear] Clear requested (not implemented)", { sessionId })

      return "WARNING: ctx-clear is not yet implemented. This would clear all Magic Context state for the current session, including tags, pending operations, and session metadata."
    },
  }
}
